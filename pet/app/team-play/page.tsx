"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePersonData, getPersonFromStorage } from "../../hooks/usePersonData";

type Room = {
    id: string;
    game: "tictactoe" | "chess" | "connect4";
    players: Array<{ id: string; name: string; color: string }>;
    turn: string;
    winner: string | null;
    state: any;
    rematchVotes?: string[];
    updatedAt?: number;
};

type Color = "w" | "b";
type PieceType = "p" | "r" | "n" | "b" | "q" | "k";
type Piece = `${Color}${PieceType}`;
type Cell = Piece | null;
type Board = Cell[][];
type Move = { fromR: number; fromC: number; toR: number; toC: number };
type StoredTeamPlaySession = {
    roomId: string;
    playerId: string;
    name?: string;
};

const TEAM_PLAY_SESSION_KEY = "team-play-session-v1";

const ICONS: Record<string, string> = {
    wp: "♙",
    wr: "♖",
    wn: "♘",
    wb: "♗",
    wq: "♕",
    wk: "♔",
    bp: "♟",
    br: "♜",
    bn: "♞",
    bb: "♝",
    bq: "♛",
    bk: "♚",
};

function inside(r: number, c: number) {
    return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function pieceColor(p: Cell): Color | null {
    return p ? (p[0] as Color) : null;
}

function cloneBoard(board: Board): Board {
    return board.map((row) => [...row]);
}

function applyMove(board: Board, m: Move): Board {
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
        for (let c = 0; c < 8; c++) {
            if (board[r][c] === king) return { r, c };
        }
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
        if (!inside(pr, pc)) continue;
        if (board[pr][pc] === `${by}p`) return true;
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

function pseudoMoves(board: Board, color: Color): Move[] {
    const out: Move[] = [];
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
                            out.push({ fromR: r, fromC: c, toR: nr, toC: nc });
                    }
                }
            }
        }
    }
    return out;
}

function legalMoves(board: Board, color: Color): Move[] {
    return pseudoMoves(board, color).filter(
        (m) => !isKingInCheck(applyMove(board, m), color),
    );
}

function TeamPlayContent() {
    const search = useSearchParams();
    const router = useRouter();
    const roomFromUrl = search.get("room") || "";

    // Usar hook para obter dados da pessoa
    const { person, loading: personLoading } = usePersonData();

    const [name, setName] = useState("");
    const [game, setGame] = useState<"tictactoe" | "chess" | "connect4">(
        "tictactoe",
    );
    const [inviteCode, setInviteCode] = useState("");
    const [room, setRoom] = useState<Room | null>(null);
    const [playerId, setPlayerId] = useState<string | null>(null);
    const [selected, setSelected] = useState<{ r: number; c: number } | null>(
        null,
    );
    const [toast, setToast] = useState<{
        message: string;
        type: "error" | "success" | "info";
    } | null>(null);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isRestoringSession, setIsRestoringSession] = useState(true);
    const [openRooms, setOpenRooms] = useState<
        Array<{
            id: string;
            game: string;
            players: number;
            host: string;
            hostId?: string;
            hostPersonId?: number;
        }>
    >([]);
    const [hasSession, setHasSession] = useState(false);
    const [personRole, setPersonRole] = useState<string | undefined>(undefined);

    // Dark mode
    useEffect(() => {
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        const apply = () => setIsDarkMode(mq.matches);
        apply();
        mq.addEventListener("change", apply);
        return () => mq.removeEventListener("change", apply);
    }, []);

    // URL room
    useEffect(() => {
        if (roomFromUrl) setInviteCode(roomFromUrl);
    }, [roomFromUrl]);

    // Atualizar nome e role quando os dados da pessoa forem carregados
    useEffect(() => {
        if (person?.name && !name) {
            setName(person.name);
        }
        if (person?.role) {
            setPersonRole(person.role);
        }
    }, [person]);

    const inviteLink = useMemo(() => {
        if (!room) return "";
        if (typeof window === "undefined") return "";
        return `${window.location.origin}/team-play?room=${room.id}`;
    }, [room]);
    const inviteRoomCode = room?.id || "";

    function showToast(
        message: string,
        type: "error" | "success" | "info" = "error",
    ) {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    }

    async function call(body: any) {
        const res = await fetch("/api/team-play", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        return res.json();
    }

    async function loadOpenRooms() {
        try {
            const res = await fetch("/api/team-play/list");
            const j = await res.json();
            if (j?.ok) {
                setOpenRooms(j.rooms || []);
            }
        } catch (e) {
            console.error("Erro ao carregar salas:", e);
        }
    }

    function saveSession(session: StoredTeamPlaySession) {
        if (typeof window === "undefined") return;
        window.localStorage.setItem(
            TEAM_PLAY_SESSION_KEY,
            JSON.stringify(session),
        );
    }

    function clearSession() {
        if (typeof window === "undefined") return;
        window.localStorage.removeItem(TEAM_PLAY_SESSION_KEY);
    }

    useEffect(() => {
        let cancelled = false;

        async function restoreSession() {
            try {
                if (typeof window === "undefined") return;
                const raw = window.localStorage.getItem(TEAM_PLAY_SESSION_KEY);
                if (!raw) return;

                const parsed = JSON.parse(raw) as StoredTeamPlaySession;
                if (!parsed?.roomId || !parsed?.playerId) return;

                if (roomFromUrl && parsed.roomId !== roomFromUrl) return;

                const roomId = roomFromUrl || parsed.roomId;
                const j = await call({ action: "get", roomId });
                if (!j?.ok || !j?.room) {
                    clearSession();
                    return;
                }

                const stillInRoom = j.room.players?.some(
                    (p: any) => p.id === parsed.playerId,
                );
                if (!stillInRoom) {
                    clearSession();
                    return;
                }

                if (cancelled) return;
                setName(parsed.name || "");
                setPlayerId(parsed.playerId);
                setRoom(j.room);
                setHasSession(true);

                // Mostra toast se houver jogo em curso
                if (!j.room.winner) {
                    showToast(
                        `Jogo em curso: ${j.room.game === "chess" ? "Xadrez" : j.room.game === "connect4" ? "4 em Linha" : "Jogo do Galo"}`,
                        "info",
                    );
                }
            } finally {
                if (!cancelled) setIsRestoringSession(false);
            }
        }

        restoreSession();
        return () => {
            cancelled = true;
        };
    }, [roomFromUrl]);

    // Carregar salas abertas e nome da sessão team-play se existir (fallback)
    useEffect(() => {
        loadOpenRooms();

        // Carregar nome da sessão team-play se existir (fallback)
        try {
            if (typeof window !== "undefined") {
                const teamPlaySession = window.localStorage.getItem(
                    TEAM_PLAY_SESSION_KEY,
                );
                if (teamPlaySession) {
                    const parsed = JSON.parse(
                        teamPlaySession,
                    ) as StoredTeamPlaySession;
                    if (parsed?.name && !name) {
                        setName(parsed.name);
                    }
                }
            }
        } catch {
            // Ignora erro
        }

        const interval = setInterval(loadOpenRooms, 3000);
        return () => clearInterval(interval);
    }, []);

    async function refresh() {
        if (!room && !roomFromUrl) return;
        const roomId = room?.id || roomFromUrl;
        const j = await call({ action: "get", roomId });
        if (j?.ok) setRoom(j.room);
    }

    useEffect(() => {
        if (!playerId || !room?.id) return;

        let lastUpdateTime = room.updatedAt ?? 0;
        let syncTimeout: NodeJS.Timeout | null = null;

        // Conectar ao SSE para atualizações em tempo real
        const eventSource = new EventSource(
            `/api/team-play/sse?roomId=${room.id}`,
        );

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data?.ok && data?.room) {
                    const newRoom = data.room;

                    // Deteta se o jogo foi resetado (desforra)
                    if (
                        newRoom.updatedAt > lastUpdateTime &&
                        !newRoom.winner &&
                        room.winner
                    ) {
                        console.log("Desforra detetada! A sincronizar...");
                        showToast("🔄 Desforra iniciada!", "success");
                        setSelected(null);

                        // Força refresh adicional após 500ms para garantir sincronização
                        if (syncTimeout) clearTimeout(syncTimeout);
                        syncTimeout = setTimeout(async () => {
                            await refresh();
                        }, 500);
                    }

                    lastUpdateTime = newRoom.updatedAt;
                    setRoom(newRoom);
                }
            } catch (e) {
                console.error("Erro ao processar atualização SSE:", e);
            }
        };

        eventSource.onerror = () => {
            // SSE reconecta automaticamente
            console.log("SSE reconectando...");
        };

        return () => {
            eventSource.close();
            if (syncTimeout) clearTimeout(syncTimeout);
        };
    }, [playerId, room?.id]);

    async function createRoom() {
        // Verifica se já tem um jogo em curso (só bloqueia se já estiver numa sala ativa)
        if (playerId && room && !room.winner) {
            showToast(
                "Já tens um jogo em curso! Volta ao jogo atual ou sai para criar nova sala.",
                "error",
            );
            return;
        }
        if (!name.trim()) {
            showToast("Indica o teu nome primeiro", "error");
            return;
        }
        const j = await call({
            action: "create",
            game,
            name: name.trim(),
            personId: person?.id,
        });
        if (!j?.ok) {
            showToast(j?.error || "Erro ao criar sala", "error");
            return;
        }
        showToast("Sala criada com sucesso!", "success");
        setRoom(j.room);
        setPlayerId(j.playerId);
        setHasSession(true);
        saveSession({
            roomId: j.room.id,
            playerId: j.playerId,
            name: name.trim(),
        });
    }

    async function joinRoom() {
        // Verifica se já tem um jogo em curso (só bloqueia se já estiver numa sala ativa)
        if (playerId && room && !room.winner) {
            showToast(
                "Já tens um jogo em curso! Volta ao jogo atual ou sai para entrar noutro.",
                "error",
            );
            return;
        }
        if (!name.trim()) {
            showToast("Indica o teu nome primeiro", "error");
            return;
        }
        const roomId = inviteCode.trim().toUpperCase();
        if (!roomId) {
            showToast("Indica o código de convite", "error");
            return;
        }
        const j = await call({ action: "join", roomId, name: name.trim() });
        if (!j?.ok) {
            showToast(j?.error || "Erro ao entrar", "error");
            return;
        }
        showToast("Entraste na sala!", "success");
        setRoom(j.room);
        setPlayerId(j.playerId);
        setHasSession(true);
        saveSession({
            roomId: j.room.id,
            playerId: j.playerId,
            name: name.trim(),
        });
    }

    async function move(move: any) {
        if (!room || !playerId) return;
        const j = await call({
            action: "move",
            roomId: room.id,
            playerId,
            move,
        });
        if (!j?.ok) {
            showToast(j?.error || "Jogada inválida", "error");
            return;
        }
        setRoom(j.room);
    }

    async function requestRematch() {
        if (!room || !playerId) return;
        const j = await call({ action: "rematch", roomId: room.id, playerId });
        if (!j?.ok) {
            showToast(j?.error || "Erro ao pedir desforra", "error");
            return;
        }

        // Se ambos votaram a desforra, o jogo foi resetado
        if (j.room.rematchVotes?.length >= 2) {
            showToast("Desforra aceite! A reiniciar jogo...", "success");
            // Força refresh imediato para sincronizar estado
            await refresh();
        } else {
            showToast("Desforra pedida! A aguardar adversário...", "info");
        }

        setSelected(null);
        setRoom(j.room);
    }

    async function closeRoom(roomId: string) {
        if (!playerId) {
            showToast("Precisas de estar numa sessão", "error");
            return;
        }
        const j = await call({
            action: "close",
            roomId,
            playerId,
            personRole,
        });
        if (!j?.ok) {
            showToast(j?.error || "Erro ao fechar sala", "error");
            return;
        }
        showToast("Sala fechada com sucesso!", "success");
        // Remove a sala da lista
        setOpenRooms((prev) => prev.filter((r) => r.id !== roomId));
        // Se era a sala atual, limpa a sessão
        if (room?.id === roomId) {
            backToLobby();
        }
    }

    function backToLobby() {
        clearSession();
        setRoom(null);
        setPlayerId(null);
        setSelected(null);
        setToast(null);
        setName("");
        setGame("tictactoe");
        setHasSession(false);
        if (roomFromUrl) router.replace("/team-play");
    }

    const me = room?.players.find((p) => p.id === playerId);
    const canPlay = !!room && !!me && room.turn === me.color && !room.winner;
    const isBlackPerspective = !!me && me.color === "b";
    const boardIndexes = isBlackPerspective
        ? [7, 6, 5, 4, 3, 2, 1, 0]
        : [0, 1, 2, 3, 4, 5, 6, 7];
    const rematchVotes = room?.rematchVotes || [];
    const meVotedRematch = !!playerId && rematchVotes.includes(playerId);
    const opponentVotedRematch =
        !!playerId && rematchVotes.some((id) => id !== playerId);
    const gameLabel = room
        ? room.game === "chess"
            ? "Xadrez"
            : room.game === "connect4"
              ? "4 em Linha"
              : "Jogo do Galo"
        : "-";
    const turnPlayer = room
        ? room.players.find((p) => p.color === room.turn)
        : null;
    const statusLabel = room
        ? room.winner
            ? room.winner === "draw"
                ? "Empate"
                : `Vitória: ${room.winner}`
            : "Em jogo"
        : "-";

    const chessBoard: Board =
        room?.game === "chess" ? (room.state.board as Board) : [];
    const chessTurn = room?.game === "chess" ? (room.turn as Color) : null;
    const allLegalMoves = useMemo(() => {
        if (room?.game !== "chess" || !chessTurn || !chessBoard?.length)
            return [] as Move[];
        return legalMoves(chessBoard, chessTurn);
    }, [room?.game, room?.turn, room?.state]);
    const selectedTargets = useMemo(() => {
        if (!selected || room?.game !== "chess") return [] as Move[];
        return allLegalMoves.filter(
            (m) => m.fromR === selected.r && m.fromC === selected.c,
        );
    }, [selected, allLegalMoves, room?.game]);
    const whiteKingPos = useMemo(
        () => (room?.game === "chess" ? findKing(chessBoard, "w") : null),
        [room?.state, room?.game],
    );
    const blackKingPos = useMemo(
        () => (room?.game === "chess" ? findKing(chessBoard, "b") : null),
        [room?.state, room?.game],
    );
    const whiteCheck = useMemo(
        () => (room?.game === "chess" ? isKingInCheck(chessBoard, "w") : false),
        [room?.state, room?.game],
    );
    const blackCheck = useMemo(
        () => (room?.game === "chess" ? isKingInCheck(chessBoard, "b") : false),
        [room?.state, room?.game],
    );

    useEffect(() => {
        if (!room?.id || !playerId) return;
        saveSession({ roomId: room.id, playerId, name: name.trim() });
    }, [room?.id, playerId, name]);

    return (
        <main style={styles.page}>
            <section style={styles.hero}>
                <h1 style={styles.title}>Team Building • Multiplayer</h1>
                <p style={styles.subtitle}>
                    Cria uma sala, partilha o link e joga em tempo real com a
                    tua equipa.
                </p>
            </section>

            {/* Banner de jogo em curso */}
            {hasSession && room && !room.winner && (
                <div
                    style={{
                        ...styles.cardCompact,
                        marginBottom: 16,
                        background:
                            "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(22,163,74,0.1))",
                        border: "1px solid rgba(34,197,94,0.3)",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                            }}
                        >
                            <span style={{ fontSize: 24 }}>🎮</span>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 15 }}>
                                    Jogo em Curso -{" "}
                                    {room.game === "chess"
                                        ? "Xadrez"
                                        : room.game === "connect4"
                                          ? "4 em Linha"
                                          : "Jogo do Galo"}
                                </div>
                                <div
                                    style={{
                                        fontSize: 12,
                                        color: "var(--muted)",
                                    }}
                                >
                                    Sala: <strong>{room.id}</strong> • És{" "}
                                    {me?.color === "X" || me?.color === "w"
                                        ? "X/Brancas"
                                        : "O/Pretas"}
                                    {room.turn === me?.color
                                        ? " • 🟢 É o teu turno!"
                                        : " • ⏳ Aguarda o adversário"}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                // Scroll para o jogo
                                window.scrollTo({
                                    top: 500,
                                    behavior: "smooth",
                                });
                            }}
                            style={btn("#22c55e")}
                        >
                            Ver Jogo
                        </button>
                    </div>
                </div>
            )}

            {/* Lista de salas abertas - sempre visível exceto quando já estás num jogo */}
            {!isRestoringSession && openRooms.length > 0 && (
                <div style={{ ...styles.cardCompact, marginBottom: 16 }}>
                    <h3 style={{ margin: "0 0 12px 0", fontSize: 16 }}>
                        🎮 Salas Abertas ({openRooms.length})
                    </h3>
                    <div style={{ display: "grid", gap: 8 }}>
                        {openRooms.map((r) => (
                            <div
                                key={r.id}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "10px 12px",
                                    borderRadius: 10,
                                    border: "1px solid rgba(255,255,255,0.15)",
                                    background: "rgba(255,255,255,0.03)",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 12,
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: 20,
                                            background: "rgba(255,255,255,0.1)",
                                            borderRadius: 6,
                                            padding: "4px 8px",
                                        }}
                                    >
                                        {r.game === "tictactoe"
                                            ? "⭕"
                                            : r.game === "chess"
                                              ? "♞"
                                              : "🔴"}
                                    </span>
                                    <div>
                                        <div style={{ fontWeight: 700 }}>
                                            {r.game === "tictactoe"
                                                ? "Jogo do Galo"
                                                : r.game === "chess"
                                                  ? "Xadrez"
                                                  : "4 em Linha"}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 12,
                                                color: "var(--muted)",
                                            }}
                                        >
                                            Host: {r.host} • {r.players}/2
                                            jogadores
                                        </div>
                                    </div>
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                    }}
                                >
                                    <button
                                        onClick={() => {
                                            if (!name.trim()) {
                                                showToast(
                                                    "Indica o teu nome primeiro",
                                                    "error",
                                                );
                                                return;
                                            }
                                            setInviteCode(r.id);
                                            joinRoom();
                                        }}
                                        style={btn("#2563eb")}
                                    >
                                        Entrar
                                    </button>
                                    {/* Botão de fechar sala - visível para dono, admin ou gestor */}
                                    {(playerId &&
                                        r.hostId &&
                                        playerId === r.hostId) ||
                                    personRole === "admin" ||
                                    personRole === "gestor" ? (
                                        <button
                                            onClick={() => closeRoom(r.id)}
                                            style={{
                                                ...btn("#ef4444"),
                                                padding: "10px 12px",
                                            }}
                                            title="Fechar sala"
                                        >
                                            ✕
                                        </button>
                                    ) : null}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!playerId && !isRestoringSession && (
                <div style={styles.cardCompact}>
                    {!hasSession && (
                        <input
                            placeholder="Teu nome"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            style={styles.input}
                        />
                    )}
                    {hasSession && (
                        <div
                            style={{
                                padding: "8px 0",
                                color: "var(--muted)",
                                fontSize: 14,
                            }}
                        >
                            👋 Olá,{" "}
                            <strong style={{ color: "var(--foreground)" }}>
                                {name}
                            </strong>
                        </div>
                    )}
                    <select
                        value={game}
                        onChange={(e) => setGame(e.target.value as any)}
                        style={styles.input}
                    >
                        <option value="tictactoe">Jogo do Galo</option>
                        <option value="chess">Xadrez</option>
                        <option value="connect4">4 em Linha</option>
                    </select>
                    <button onClick={createRoom} style={btn("#16a34a")}>
                        Criar sala e gerar link
                    </button>

                    <div style={styles.divider}>ou</div>

                    <input
                        placeholder="Código de convite (ex: A1B2C3)"
                        value={inviteCode}
                        onChange={(e) =>
                            setInviteCode(e.target.value.toUpperCase())
                        }
                        style={styles.input}
                    />
                    <button onClick={joinRoom} style={btn("#2563eb")}>
                        Entrar por código
                    </button>
                </div>
            )}

            {!playerId && isRestoringSession && (
                <div style={styles.cardCompact}>
                    <div style={{ color: "var(--muted)" }}>
                        A recuperar sessão...
                    </div>
                </div>
            )}

            {room && playerId && (
                <div style={{ marginTop: 16 }}>
                    <div style={styles.card}>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "flex-end",
                            }}
                        >
                            <button
                                onClick={backToLobby}
                                style={styles.ghostBtn}
                            >
                                ← Voltar
                            </button>
                        </div>
                        <div style={styles.infoGrid}>
                            <div style={styles.infoItem}>
                                <span style={styles.infoLabel}>Sala</span>
                                <strong>{room.id}</strong>
                            </div>
                            <div style={styles.infoItem}>
                                <span style={styles.infoLabel}>Jogo</span>
                                <strong>{gameLabel}</strong>
                            </div>
                            <div style={styles.infoItem}>
                                <span style={styles.infoLabel}>Turno</span>
                                <strong>
                                    {turnPlayer
                                        ? `${turnPlayer.name} (${room.turn})`
                                        : room.turn}
                                </strong>
                            </div>
                            <div style={styles.infoItem}>
                                <span style={styles.infoLabel}>Estado</span>
                                <strong
                                    style={{
                                        color: room.winner
                                            ? "#f59e0b"
                                            : "#22c55e",
                                    }}
                                >
                                    {statusLabel}
                                </strong>
                            </div>
                        </div>

                        <div style={styles.playersWrap}>
                            {room.players.map((p) => (
                                <div
                                    key={p.id}
                                    style={{
                                        ...styles.playerPill,
                                        borderColor:
                                            p.id === playerId
                                                ? "#3b82f6"
                                                : "rgba(255,255,255,0.12)",
                                    }}
                                >
                                    <span style={styles.playerDot}>
                                        {p.color.toUpperCase()}
                                    </span>
                                    <span>
                                        <strong>{p.name}</strong>
                                        {p.id === playerId ? " (tu)" : ""}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {room.game === "chess" &&
                            !room.winner &&
                            (whiteCheck || blackCheck) && (
                                <div style={styles.checkAlert}>
                                    {whiteCheck && "♔ Rei branco em check"}
                                    {whiteCheck && blackCheck ? " • " : ""}
                                    {blackCheck && "♚ Rei preto em check"}
                                </div>
                            )}

                        {inviteLink && (
                            <>
                                <div
                                    style={{
                                        display: "flex",
                                        gap: 8,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <input
                                        readOnly
                                        value={inviteLink}
                                        style={{
                                            ...styles.input,
                                            flex: 1,
                                            minWidth: 260,
                                        }}
                                    />
                                    <button
                                        onClick={() =>
                                            navigator.clipboard.writeText(
                                                inviteLink,
                                            )
                                        }
                                        style={btn("#2563eb")}
                                    >
                                        Copiar link
                                    </button>
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        gap: 8,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <input
                                        readOnly
                                        value={inviteRoomCode}
                                        style={{
                                            ...styles.input,
                                            flex: 1,
                                            minWidth: 180,
                                            fontWeight: 800,
                                            letterSpacing: 1.2,
                                        }}
                                    />
                                    <button
                                        onClick={() =>
                                            navigator.clipboard.writeText(
                                                inviteRoomCode,
                                            )
                                        }
                                        style={btn("#0ea5e9")}
                                    >
                                        Copiar código
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {room.game === "tictactoe" && (
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "repeat(3, minmax(0, 1fr))",
                                gap: 8,
                                width: "min(92vw, 360px)",
                            }}
                        >
                            {room.state.board.map((cell: any, idx: number) => (
                                <button
                                    key={idx}
                                    style={{
                                        width: "100%",
                                        aspectRatio: "1 / 1",
                                        fontSize: "clamp(28px, 8vw, 34px)",
                                        fontWeight: 800,
                                        borderRadius: 14,
                                        border: "1px solid rgba(255,255,255,0.18)",
                                        background: "var(--card-bg)",
                                        color:
                                            cell === "X"
                                                ? "#ef4444"
                                                : cell === "O"
                                                  ? "#2563eb"
                                                  : "var(--foreground)",
                                        textShadow: cell
                                            ? "0 1px 0 rgba(0,0,0,0.35)"
                                            : "none",
                                        boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                                    }}
                                    disabled={!canPlay || !!cell}
                                    onClick={() => move({ index: idx })}
                                >
                                    {cell || ""}
                                </button>
                            ))}
                        </div>
                    )}

                    {room.game === "chess" && (
                        <div
                            style={{
                                width: "min(94vw, 520px)",
                                border: "2px solid var(--card-border)",
                                borderRadius: 12,
                                overflow: "hidden",
                                boxShadow: "0 16px 36px rgba(0,0,0,0.22)",
                            }}
                        >
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns:
                                        "repeat(8, minmax(0, 1fr))",
                                    width: "100%",
                                }}
                            >
                                {boardIndexes.map((vr) =>
                                    boardIndexes.map((vc) => {
                                        const p: string | null =
                                            room.state.board[vr][vc];
                                        const dark = (vr + vc) % 2 === 1;
                                        const isSelected =
                                            selected?.r === vr &&
                                            selected?.c === vc;
                                        const isTarget = selectedTargets.some(
                                            (m) => m.toR === vr && m.toC === vc,
                                        );
                                        const isWhiteKingInCheck =
                                            !!whiteCheck &&
                                            whiteKingPos?.r === vr &&
                                            whiteKingPos?.c === vc;
                                        const isBlackKingInCheck =
                                            !!blackCheck &&
                                            blackKingPos?.r === vr &&
                                            blackKingPos?.c === vc;
                                        return (
                                            <button
                                                key={`${vr}-${vc}`}
                                                onClick={() => {
                                                    if (!canPlay) return;
                                                    if (selected) {
                                                        move({
                                                            fromR: selected.r,
                                                            fromC: selected.c,
                                                            toR: vr,
                                                            toC: vc,
                                                        });
                                                        setSelected(null);
                                                        return;
                                                    }
                                                    if (
                                                        p &&
                                                        me &&
                                                        p[0] === me.color
                                                    )
                                                        setSelected({
                                                            r: vr,
                                                            c: vc,
                                                        });
                                                }}
                                                style={{
                                                    position: "relative",
                                                    width: "100%",
                                                    aspectRatio: "1 / 1",
                                                    border: "1px solid rgba(0,0,0,0.15)",
                                                    background:
                                                        isWhiteKingInCheck ||
                                                        isBlackKingInCheck
                                                            ? "#ef4444"
                                                            : isSelected
                                                              ? "#f59e0b"
                                                              : isTarget
                                                                ? "#22c55e"
                                                                : dark
                                                                  ? isDarkMode
                                                                      ? "#7c5a3f"
                                                                      : "#b58863"
                                                                  : isDarkMode
                                                                    ? "#d9c7ab"
                                                                    : "#f0d9b5",
                                                    fontSize:
                                                        "clamp(18px, 4.7vw, 26px)",
                                                    fontWeight: 700,
                                                    color: p
                                                        ? p[0] === "w"
                                                            ? "#fffef8"
                                                            : "#111111"
                                                        : "transparent",
                                                    textShadow:
                                                        p?.[0] === "w"
                                                            ? "0 1px 0 rgba(0,0,0,0.95), 0 -1px 0 rgba(0,0,0,0.95), 1px 0 0 rgba(0,0,0,0.95), -1px 0 0 rgba(0,0,0,0.95), 0 0 3px rgba(0,0,0,0.65)"
                                                            : "0 0 1px rgba(255,255,255,0.4)",
                                                    boxShadow: isSelected
                                                        ? "inset 0 0 0 3px #fef3c7, 0 0 0 2px rgba(0,0,0,0.35)"
                                                        : isTarget
                                                          ? "inset 0 0 0 2px rgba(255,255,255,0.65)"
                                                          : "none",
                                                }}
                                            >
                                                {isTarget && !p && (
                                                    <span
                                                        style={{
                                                            position:
                                                                "absolute",
                                                            width: 10,
                                                            height: 10,
                                                            borderRadius: "50%",
                                                            background:
                                                                "rgba(255,255,255,0.85)",
                                                            top: "50%",
                                                            left: "50%",
                                                            transform:
                                                                "translate(-50%, -50%)",
                                                        }}
                                                    />
                                                )}
                                                {isTarget && p && (
                                                    <span
                                                        style={{
                                                            position:
                                                                "absolute",
                                                            inset: 4,
                                                            borderRadius: "50%",
                                                            border: "2px solid rgba(255,255,255,0.9)",
                                                            pointerEvents:
                                                                "none",
                                                        }}
                                                    />
                                                )}
                                                {p ? ICONS[p] : ""}
                                            </button>
                                        );
                                    }),
                                )}
                            </div>
                        </div>
                    )}

                    {room.game === "connect4" && (
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "repeat(7, minmax(0, 1fr))",
                                gap: 6,
                                width: "min(94vw, 460px)",
                            }}
                        >
                            {Array.from({ length: 7 }).map((_, col) => (
                                <button
                                    key={`top-${col}`}
                                    onClick={() => move({ col })}
                                    disabled={!canPlay || !!room.winner}
                                    style={{
                                        height: "clamp(28px, 7vw, 34px)",
                                        borderRadius: 10,
                                        border: "1px solid rgba(255,255,255,0.2)",
                                        background:
                                            "linear-gradient(135deg, var(--accent), #1d4ed8)",
                                        color: "white",
                                        cursor: "pointer",
                                        fontWeight: 800,
                                    }}
                                >
                                    ↓
                                </button>
                            ))}
                            {(
                                room.state.board as Array<
                                    Array<"R" | "Y" | null>
                                >
                            ).map((row, r) =>
                                row.map((cell, c) => (
                                    <div
                                        key={`${r}-${c}`}
                                        style={{
                                            width: "100%",
                                            aspectRatio: "1 / 1",
                                            borderRadius: "50%",
                                            background:
                                                cell === "R"
                                                    ? "#ef4444"
                                                    : cell === "Y"
                                                      ? "#facc15"
                                                      : "#1f2937",
                                            border: "3px solid rgba(255,255,255,0.25)",
                                        }}
                                    />
                                )),
                            )}
                        </div>
                    )}

                    {!!room.winner && (
                        <div
                            style={{
                                position: "fixed",
                                inset: 0,
                                background: "rgba(2,6,23,0.68)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                zIndex: 2000,
                            }}
                        >
                            <div
                                style={{
                                    width: "min(92vw, 460px)",
                                    background: "var(--card-bg)",
                                    border: "1px solid rgba(255,255,255,0.15)",
                                    borderRadius: 20,
                                    padding: 18,
                                    color: "var(--foreground)",
                                    boxShadow: "0 28px 80px rgba(0,0,0,0.45)",
                                }}
                            >
                                <h3 style={{ marginTop: 0, marginBottom: 8 }}>
                                    🏁 Jogo terminado
                                </h3>
                                <p style={{ marginTop: 0 }}>
                                    {room.winner === "draw"
                                        ? "Empate!"
                                        : `Vencedor: ${room.winner}`}
                                </p>

                                {room.players.length < 2 ? (
                                    <p
                                        style={{
                                            color: "var(--muted)",
                                            marginBottom: 0,
                                        }}
                                    >
                                        Aguardando segundo jogador para permitir
                                        desforra.
                                    </p>
                                ) : (
                                    <>
                                        <p style={{ color: "var(--muted)" }}>
                                            {meVotedRematch
                                                ? opponentVotedRematch
                                                    ? "A iniciar desforra..."
                                                    : "Pedido enviado. A aguardar o outro jogador aceitar."
                                                : opponentVotedRematch
                                                  ? "O outro jogador pediu desforra. Aceitas?"
                                                  : "Queres jogar desforra?"}
                                        </p>
                                        <div
                                            style={{
                                                display: "flex",
                                                gap: 8,
                                                justifyContent: "flex-end",
                                            }}
                                        >
                                            <button
                                                onClick={backToLobby}
                                                style={styles.ghostBtn}
                                            >
                                                Voltar ao lobby
                                            </button>
                                            <button
                                                onClick={requestRematch}
                                                style={btn("#2563eb")}
                                            >
                                                {meVotedRematch
                                                    ? "Atualizar"
                                                    : opponentVotedRematch
                                                      ? "Aceitar desforra"
                                                      : "Pedir desforra"}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div
                    style={{
                        position: "fixed",
                        bottom: 24,
                        left: "50%",
                        transform: "translateX(-50%)",
                        padding: "12px 20px",
                        borderRadius: 12,
                        background:
                            toast.type === "error"
                                ? "#ef4444"
                                : toast.type === "success"
                                  ? "#22c55e"
                                  : "#3b82f6",
                        color: "white",
                        fontWeight: 700,
                        boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                        zIndex: 3000,
                    }}
                >
                    {toast.message}
                </div>
            )}
        </main>
    );
}

function btn(bg: string): React.CSSProperties {
    return {
        padding: "10px 14px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.2)",
        cursor: "pointer",
        color: "white",
        fontWeight: 700,
        background: `linear-gradient(135deg, ${bg}, #1d4ed8)`,
        boxShadow: "0 8px 24px rgba(37,99,235,0.35)",
    };
}

const styles: Record<string, React.CSSProperties> = {
    page: {
        maxWidth: 980,
        margin: "24px auto",
        padding: 16,
        color: "var(--foreground)",
    },
    hero: {
        padding: 18,
        borderRadius: 20,
        marginBottom: 14,
        border: "1px solid rgba(255,255,255,0.14)",
        background:
            "linear-gradient(130deg, rgba(37,99,235,0.22), rgba(16,185,129,0.14))",
        boxShadow: "0 20px 48px rgba(0,0,0,0.24)",
    },
    title: {
        margin: 0,
        fontSize: 30,
        fontWeight: 900,
        letterSpacing: 0.3,
    },
    subtitle: {
        marginTop: 8,
        marginBottom: 0,
        color: "var(--muted)",
        fontSize: 15,
    },
    card: {
        marginBottom: 12,
        display: "grid",
        gap: 8,
        background: "var(--card-bg)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 16,
        padding: 14,
        boxShadow: "0 16px 36px rgba(0,0,0,0.2)",
    },
    infoGrid: {
        display: "grid",
        gap: 10,
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    },
    infoItem: {
        display: "grid",
        gap: 4,
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.02)",
    },
    infoLabel: {
        fontSize: 12,
        color: "var(--muted)",
        textTransform: "uppercase",
        letterSpacing: 0.4,
        fontWeight: 700,
    },
    playersWrap: {
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
    },
    playerPill: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 10px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.03)",
    },
    playerDot: {
        width: 22,
        height: 22,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        fontSize: 11,
        fontWeight: 800,
        background: "rgba(59,130,246,0.25)",
        color: "#bfdbfe",
    },
    checkAlert: {
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid rgba(239,68,68,0.4)",
        background: "rgba(239,68,68,0.1)",
        color: "#fca5a5",
        fontWeight: 700,
    },
    cardCompact: {
        display: "grid",
        gap: 10,
        maxWidth: 430,
        background: "var(--card-bg)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 16,
        padding: 14,
        boxShadow: "0 16px 36px rgba(0,0,0,0.2)",
    },
    input: {
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid var(--card-border)",
        background: "var(--background)",
        color: "var(--foreground)",
        outline: "none",
    },
    ghostBtn: {
        padding: "9px 12px",
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.2)",
        background: "rgba(255,255,255,0.04)",
        color: "var(--foreground)",
        cursor: "pointer",
        fontWeight: 700,
    },
    divider: {
        textAlign: "center",
        color: "var(--muted)",
        fontWeight: 700,
        fontSize: 13,
        margin: "2px 0",
    },
};

export default function TeamPlayPage() {
    return (
        <Suspense
            fallback={
                <main style={{ padding: 16 }}>A carregar Team Play...</main>
            }
        >
            <TeamPlayContent />
        </Suspense>
    );
}
