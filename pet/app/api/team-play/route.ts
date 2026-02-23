import { NextResponse } from "next/server";
import { setRoom, getRoom } from "./storage";

type GameType = "tictactoe" | "chess" | "connect4";
type Color = "w" | "b";
type PieceType = "p" | "r" | "n" | "b" | "q" | "k";
type Piece = `${Color}${PieceType}`;
type Cell = Piece | null;
type Board = Cell[][];

type TicTacToeState = {
    board: Array<"X" | "O" | null>;
};

type ChessState = {
    board: Board;
};

type Connect4State = {
    board: Array<Array<"R" | "Y" | null>>;
};

type Room = {
    id: string;
    game: GameType;
    players: Array<{ id: string; name: string; color: "X" | "O" | "w" | "b" }>;
    turn: "X" | "O" | "w" | "b";
    winner: "X" | "O" | "w" | "b" | "draw" | null;
    state: TicTacToeState | ChessState | Connect4State;
    rematchVotes: string[];
    updatedAt: number;
};

function initialConnect4Board() {
    return Array.from({ length: 6 }, () => Array(7).fill(null)) as Array<
        Array<"R" | "Y" | null>
    >;
}

function connect4DropRow(board: Array<Array<"R" | "Y" | null>>, col: number) {
    for (let r = 5; r >= 0; r--) if (!board[r][col]) return r;
    return -1;
}

function connect4Winner(
    board: Array<Array<"R" | "Y" | null>>,
): "R" | "Y" | "draw" | null {
    const dirs = [
        [0, 1],
        [1, 0],
        [1, 1],
        [1, -1],
    ];
    for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 7; c++) {
            const cell = board[r][c];
            if (!cell) continue;
            for (const [dr, dc] of dirs) {
                let ok = true;
                for (let i = 1; i < 4; i++) {
                    const nr = r + dr * i;
                    const nc = c + dc * i;
                    if (
                        nr < 0 ||
                        nr >= 6 ||
                        nc < 0 ||
                        nc >= 7 ||
                        board[nr][nc] !== cell
                    ) {
                        ok = false;
                        break;
                    }
                }
                if (ok) return cell;
            }
        }
    }
    if (board.every((row) => row.every((x) => x))) return "draw";
    return null;
}

function randomId(size = 8) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let out = "";
    for (let i = 0; i < size; i++)
        out += chars[Math.floor(Math.random() * chars.length)];
    return out;
}

function initialChessBoard(): Board {
    return [
        ["br", "bn", "bb", "bq", "bk", "bb", "bn", "br"],
        ["bp", "bp", "bp", "bp", "bp", "bp", "bp", "bp"],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        ["wp", "wp", "wp", "wp", "wp", "wp", "wp", "wp"],
        ["wr", "wn", "wb", "wq", "wk", "wb", "wn", "wr"],
    ];
}

function clean(room: Room) {
    return {
        id: room.id,
        game: room.game,
        players: room.players,
        turn: room.turn,
        winner: room.winner,
        state: room.state,
        rematchVotes: room.rematchVotes,
        updatedAt: room.updatedAt,
    };
}

function resetRoomForRematch(room: Room) {
    // Alterna lados para dar fairness na desforra
    room.players = room.players.map((p) => {
        if (room.game === "tictactoe") {
            return { ...p, color: p.color === "X" ? "O" : "X" };
        }
        if (room.game === "connect4") {
            return { ...p, color: p.color === "w" ? "b" : "w" };
        }
        return { ...p, color: p.color === "w" ? "b" : "w" };
    });
    room.turn = room.game === "tictactoe" ? "X" : "w";
    room.winner = null;
    room.state =
        room.game === "tictactoe"
            ? { board: Array(9).fill(null) }
            : room.game === "connect4"
              ? { board: initialConnect4Board() }
              : { board: initialChessBoard() };
    room.rematchVotes = [];
    room.updatedAt = Date.now();
}

function inside(r: number, c: number) {
    return r >= 0 && r < 8 && c >= 0 && c < 8;
}
function pieceColor(p: Cell): Color | null {
    return p ? (p[0] as Color) : null;
}
function cloneBoard(board: Board): Board {
    return board.map((row) => [...row]);
}
function applyChessMove(
    board: Board,
    m: { fromR: number; fromC: number; toR: number; toC: number },
): Board {
    const next = cloneBoard(board);
    const piece = next[m.fromR][m.fromC];
    next[m.fromR][m.fromC] = null;
    next[m.toR][m.toC] = piece;
    if (piece === "wp" && m.toR === 0) next[m.toR][m.toC] = "wq";
    if (piece === "bp" && m.toR === 7) next[m.toR][m.toC] = "bq";
    return next;
}
function findKing(board: Board, color: Color): { r: number; c: number } | null {
    const king = `${color}k` as Piece;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) if (board[r][c] === king) return { r, c };
    }
    return null;
}
function isSquareAttacked(
    board: Board,
    r: number,
    c: number,
    by: Color,
): boolean {
    const pawnDir = by === "w" ? -1 : 1;
    for (const dc of [-1, 1]) {
        const pr = r - pawnDir;
        const pc = c - dc;
        if (inside(pr, pc) && board[pr][pc] === `${by}p`) return true;
    }
    for (const [dr, dc] of [
        [-2, -1],
        [-2, 1],
        [-1, -2],
        [-1, 2],
        [1, -2],
        [1, 2],
        [2, -1],
        [2, 1],
    ]) {
        const nr = r + dr;
        const nc = c + dc;
        if (inside(nr, nc) && board[nr][nc] === `${by}n`) return true;
    }
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (!dr && !dc) continue;
            const nr = r + dr;
            const nc = c + dc;
            if (inside(nr, nc) && board[nr][nc] === `${by}k`) return true;
        }
    }
    for (const [dr, dc] of [
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
    ]) {
        let nr = r + dr;
        let nc = c + dc;
        while (inside(nr, nc)) {
            const p = board[nr][nc];
            if (p) {
                if (p[0] === by && (p[1] === "b" || p[1] === "q")) return true;
                break;
            }
            nr += dr;
            nc += dc;
        }
    }
    for (const [dr, dc] of [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
    ]) {
        let nr = r + dr;
        let nc = c + dc;
        while (inside(nr, nc)) {
            const p = board[nr][nc];
            if (p) {
                if (p[0] === by && (p[1] === "r" || p[1] === "q")) return true;
                break;
            }
            nr += dr;
            nc += dc;
        }
    }
    return false;
}
function isKingInCheck(board: Board, color: Color) {
    const king = findKing(board, color);
    if (!king) return true;
    const enemy: Color = color === "w" ? "b" : "w";
    return isSquareAttacked(board, king.r, king.c, enemy);
}
function pseudoMoves(board: Board, color: Color) {
    const out: Array<{
        fromR: number;
        fromC: number;
        toR: number;
        toC: number;
    }> = [];
    const pushLine = (fromR: number, fromC: number, dr: number, dc: number) => {
        let r = fromR + dr;
        let c = fromC + dc;
        while (inside(r, c)) {
            const t = board[r][c];
            if (!t) out.push({ fromR, fromC, toR: r, toC: c });
            else {
                if (pieceColor(t) !== color && t[1] !== "k")
                    out.push({ fromR, fromC, toR: r, toC: c });
                break;
            }
            r += dr;
            c += dc;
        }
    };
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (!p || p[0] !== color) continue;
            const t = p[1];
            if (t === "p") {
                const dir = color === "w" ? -1 : 1;
                const start = color === "w" ? 6 : 1;
                const fr = r + dir;
                if (inside(fr, c) && !board[fr][c])
                    out.push({ fromR: r, fromC: c, toR: fr, toC: c });
                const fr2 = r + 2 * dir;
                if (
                    r === start &&
                    inside(fr2, c) &&
                    !board[fr][c] &&
                    !board[fr2][c]
                )
                    out.push({ fromR: r, fromC: c, toR: fr2, toC: c });
                for (const dc of [-1, 1]) {
                    const cr = r + dir;
                    const cc = c + dc;
                    if (!inside(cr, cc)) continue;
                    const tp = board[cr][cc];
                    if (tp && pieceColor(tp) !== color && tp[1] !== "k")
                        out.push({ fromR: r, fromC: c, toR: cr, toC: cc });
                }
            }
            if (t === "n") {
                for (const [dr, dc] of [
                    [-2, -1],
                    [-2, 1],
                    [-1, -2],
                    [-1, 2],
                    [1, -2],
                    [1, 2],
                    [2, -1],
                    [2, 1],
                ]) {
                    const nr = r + dr;
                    const nc = c + dc;
                    if (!inside(nr, nc)) continue;
                    const tp = board[nr][nc];
                    if (!tp || (pieceColor(tp) !== color && tp[1] !== "k"))
                        out.push({ fromR: r, fromC: c, toR: nr, toC: nc });
                }
            }
            if (t === "b" || t === "q") {
                pushLine(r, c, -1, -1);
                pushLine(r, c, -1, 1);
                pushLine(r, c, 1, -1);
                pushLine(r, c, 1, 1);
            }
            if (t === "r" || t === "q") {
                pushLine(r, c, -1, 0);
                pushLine(r, c, 1, 0);
                pushLine(r, c, 0, -1);
                pushLine(r, c, 0, 1);
            }
            if (t === "k") {
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        if (!dr && !dc) continue;
                        const nr = r + dr;
                        const nc = c + dc;
                        if (!inside(nr, nc)) continue;
                        const tp = board[nr][nc];
                        if (!tp || (pieceColor(tp) !== color && tp[1] !== "k"))
                            out.push({
                                fromR: r,
                                fromC: c,
                                toR: nr,
                                toC: nc,
                            });
                    }
                }
            }
        }
    }
    return out;
}
function legalChessMoves(board: Board, color: Color) {
    return pseudoMoves(board, color).filter(
        (m) => !isKingInCheck(applyChessMove(board, m), color),
    );
}
function chessResult(board: Board, turn: Color): "w" | "b" | "draw" | null {
    const wk = !!findKing(board, "w");
    const bk = !!findKing(board, "b");
    if (!wk) return "b";
    if (!bk) return "w";
    const lm = legalChessMoves(board, turn);
    if (lm.length === 0)
        return isKingInCheck(board, turn) ? (turn === "w" ? "b" : "w") : "draw";
    return null;
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const action = body?.action as string;

        if (action === "create") {
            const game = body?.game as GameType;
            const name = (body?.name as string)?.trim();
            if (
                !name ||
                (game !== "tictactoe" &&
                    game !== "chess" &&
                    game !== "connect4")
            ) {
                return NextResponse.json(
                    { ok: false, error: "Dados inválidos" },
                    { status: 400 },
                );
            }
            const roomId = randomId(6);
            const playerId = randomId(10);
            const room: Room = {
                id: roomId,
                game,
                players: [
                    {
                        id: playerId,
                        name,
                        color: game === "tictactoe" ? "X" : "w",
                    },
                ],
                turn: game === "tictactoe" ? "X" : "w",
                winner: null,
                state:
                    game === "tictactoe"
                        ? { board: Array(9).fill(null) }
                        : game === "connect4"
                          ? { board: initialConnect4Board() }
                          : { board: initialChessBoard() },
                rematchVotes: [],
                updatedAt: Date.now(),
            };
            setRoom(roomId, room);
            return NextResponse.json({ ok: true, room: clean(room), playerId });
        }

        if (action === "join") {
            const roomId = body?.roomId as string;
            const name = (body?.name as string)?.trim();
            const room = getRoom(roomId);
            if (!room || !name)
                return NextResponse.json(
                    { ok: false, error: "Sala não encontrada" },
                    { status: 404 },
                );
            if (room.players.length >= 2)
                return NextResponse.json(
                    { ok: false, error: "Sala cheia" },
                    { status: 400 },
                );
            const playerId = randomId(10);
            room.players.push({
                id: playerId,
                name,
                color: room.game === "tictactoe" ? "O" : "b",
            });
            room.updatedAt = Date.now();
            setRoom(roomId, room);
            return NextResponse.json({ ok: true, room: clean(room), playerId });
        }

        if (action === "get") {
            const roomId = body?.roomId as string;
            const room = getRoom(roomId);
            if (!room)
                return NextResponse.json(
                    { ok: false, error: "Sala não encontrada" },
                    { status: 404 },
                );
            return NextResponse.json({ ok: true, room: clean(room) });
        }

        if (action === "move") {
            const roomId = body?.roomId as string;
            const playerId = body?.playerId as string;
            const room = getRoom(roomId);
            if (!room)
                return NextResponse.json(
                    { ok: false, error: "Sala não encontrada" },
                    { status: 404 },
                );
            const player = room.players.find((p) => p.id === playerId);
            if (!player)
                return NextResponse.json(
                    { ok: false, error: "Jogador inválido" },
                    { status: 403 },
                );
            if (room.winner)
                return NextResponse.json(
                    { ok: false, error: "Jogo terminado" },
                    { status: 400 },
                );
            if (String(player.color) !== String(room.turn))
                return NextResponse.json(
                    { ok: false, error: "Não é a tua vez" },
                    { status: 400 },
                );

            if (room.game === "tictactoe") {
                const idx = Number(body?.move?.index);
                const st = room.state as TicTacToeState;
                if (Number.isNaN(idx) || idx < 0 || idx > 8 || st.board[idx]) {
                    return NextResponse.json(
                        { ok: false, error: "Jogada inválida" },
                        { status: 400 },
                    );
                }
                st.board[idx] = room.turn as "X" | "O";
                const lines = [
                    [0, 1, 2],
                    [3, 4, 5],
                    [6, 7, 8],
                    [0, 3, 6],
                    [1, 4, 7],
                    [2, 5, 8],
                    [0, 4, 8],
                    [2, 4, 6],
                ];
                for (const [a, b, c] of lines) {
                    if (
                        st.board[a] &&
                        st.board[a] === st.board[b] &&
                        st.board[a] === st.board[c]
                    )
                        room.winner = st.board[a] as "X" | "O";
                }
                if (!room.winner && st.board.every((x) => x))
                    room.winner = "draw";
                if (!room.winner) room.turn = room.turn === "X" ? "O" : "X";
            } else if (room.game === "chess") {
                const m = body?.move as {
                    fromR: number;
                    fromC: number;
                    toR: number;
                    toC: number;
                };
                const st = room.state as ChessState;
                const legal = legalChessMoves(st.board, room.turn as Color);
                const ok = legal.some(
                    (lm) =>
                        lm.fromR === m?.fromR &&
                        lm.fromC === m?.fromC &&
                        lm.toR === m?.toR &&
                        lm.toC === m?.toC,
                );
                if (!ok)
                    return NextResponse.json(
                        { ok: false, error: "Jogada inválida" },
                        { status: 400 },
                    );

                st.board = applyChessMove(st.board, m);
                room.turn = room.turn === "w" ? "b" : "w";
                room.winner = chessResult(st.board, room.turn as Color);
            } else {
                // connect4 (usa w/b como turn; w=R e b=Y)
                const col = Number(body?.move?.col);
                const st = room.state as Connect4State;
                if (Number.isNaN(col) || col < 0 || col > 6) {
                    return NextResponse.json(
                        { ok: false, error: "Jogada inválida" },
                        { status: 400 },
                    );
                }
                const row = connect4DropRow(st.board, col);
                if (row < 0) {
                    return NextResponse.json(
                        { ok: false, error: "Coluna cheia" },
                        { status: 400 },
                    );
                }
                st.board[row][col] = room.turn === "w" ? "R" : "Y";
                const w = connect4Winner(st.board);
                if (w) {
                    room.winner = w === "draw" ? "draw" : w === "R" ? "w" : "b";
                } else {
                    room.turn = room.turn === "w" ? "b" : "w";
                }
            }

            room.updatedAt = Date.now();
            setRoom(roomId, room);
            return NextResponse.json({ ok: true, room: clean(room) });
        }

        if (action === "rematch") {
            const roomId = body?.roomId as string;
            const playerId = body?.playerId as string;
            const room = getRoom(roomId);
            if (!room)
                return NextResponse.json(
                    { ok: false, error: "Sala não encontrada" },
                    { status: 404 },
                );
            const player = room.players.find((p) => p.id === playerId);
            if (!player)
                return NextResponse.json(
                    { ok: false, error: "Jogador inválido" },
                    { status: 403 },
                );
            if (!room.winner)
                return NextResponse.json(
                    {
                        ok: false,
                        error: "A desforra só pode ser pedida no fim do jogo",
                    },
                    { status: 400 },
                );

            if (!room.rematchVotes.includes(playerId))
                room.rematchVotes.push(playerId);

            if (room.rematchVotes.length >= 2) {
                resetRoomForRematch(room);
                setRoom(roomId, room);
            } else {
                room.updatedAt = Date.now();
                setRoom(roomId, room);
            }

            return NextResponse.json({ ok: true, room: clean(room) });
        }

        return NextResponse.json(
            { ok: false, error: "Ação inválida" },
            { status: 400 },
        );
    } catch (err: any) {
        return NextResponse.json(
            { ok: false, error: err.message },
            { status: 500 },
        );
    }
}
