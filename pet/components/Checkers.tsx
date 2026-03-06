"use client";

import React, { useState, useEffect } from "react";

type Piece = "red" | "black" | "red-king" | "black-king" | null;
type Board = Piece[][];
type Position = { r: number; c: number };
type Move = { from: Position; to: Position; capture?: Position };

const BOARD_SIZE = 8;

function initialBoard(): Board {
  const board: Board = Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(null));

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if ((r + c) % 2 === 1) {
        if (r < 3) board[r][c] = "black";
        if (r > 4) board[r][c] = "red";
      }
    }
  }

  return board;
}

function isValidPos(r: number, c: number): boolean {
  return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;
}

function getPieceColor(piece: Piece): "red" | "black" | null {
  if (!piece) return null;
  return piece.startsWith("red") ? "red" : "black";
}

function isKing(piece: Piece): boolean {
  return piece?.includes("king") ?? false;
}

function getAllMoves(board: Board, color: "red" | "black"): Move[] {
  const moves: Move[] = [];

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const piece = board[r][c];
      if (piece && getPieceColor(piece) === color) {
        const pieceMoves = getMovesForPiece(board, { r, c }, piece);
        moves.push(...pieceMoves);
      }
    }
  }

  return moves;
}

function getMovesForPiece(board: Board, pos: Position, piece: Piece): Move[] {
  const moves: Move[] = [];
  const color = getPieceColor(piece)!;
  const king = isKing(piece);

  // Direcções: red move para cima (-1), black move para baixo (+1), reis para ambos
  const directions: number[] = [];
  if (color === "red" || king) directions.push(-1);
  if (color === "black" || king) directions.push(1);

  // Movimento simples (1 casa na diagonal)
  for (const dr of directions) {
    for (const dc of [-1, 1]) {
      const nr = pos.r + dr;
      const nc = pos.c + dc;

      if (isValidPos(nr, nc) && board[nr][nc] === null) {
        moves.push({ from: pos, to: { r: nr, c: nc } });
      }
    }
  }

  // Capturas para peças NORMAIS (apenas para frente)
  if (!king) {
    const captureDir = color === "red" ? -1 : 1; // red captura para cima, black para baixo
    for (const dc of [-1, 1]) {
      const mr = pos.r + captureDir; // casa da peça inimiga
      const mc = pos.c + dc;
      const jr = pos.r + captureDir * 2; // casa de aterragem
      const jc = pos.c + dc * 2;

      if (isValidPos(jr, jc) && isValidPos(mr, mc)) {
        const midPiece = board[mr][mc];
        if (
          midPiece &&
          getPieceColor(midPiece) !== color &&
          board[jr][jc] === null
        ) {
          moves.push({
            from: pos,
            to: { r: jr, c: jc },
            capture: { r: mr, c: mc },
          });
        }
      }
    }
  }

  // Capturas para REIS (qualquer direção, múltiplas casas)
  if (king) {
    for (const dr of [-1, 1]) {
      for (const dc of [-1, 1]) {
        // Procurar peça inimiga nesta diagonal
        let enemyPos: Position | null = null;
        let distance = 1;

        while (true) {
          const checkR = pos.r + dr * distance;
          const checkC = pos.c + dc * distance;

          if (!isValidPos(checkR, checkC)) break;

          const checkPiece = board[checkR][checkC];

          if (!checkPiece) {
            // Casa vazia - se já encontramos inimigo, podemos capturar
            if (enemyPos) {
              moves.push({
                from: pos,
                to: { r: checkR, c: checkC },
                capture: enemyPos,
              });
            }
          } else if (getPieceColor(checkPiece) !== color) {
            // Inimigo encontrado - guardar posição se for o primeiro
            if (!enemyPos) {
              enemyPos = { r: checkR, c: checkC };
            } else {
              // Segundo inimigo - parar
              break;
            }
          } else {
            // Peça amiga - parar
            break;
          }

          distance++;
        }
      }
    }
  }

  return moves;
}

function hasCaptures(moves: Move[]): boolean {
  return moves.some((m) => m.capture);
}

function makeMove(board: Board, move: Move): Board {
  const newBoard = board.map((row) => [...row]);
  const piece = newBoard[move.from.r][move.from.c]!;

  newBoard[move.to.r][move.to.c] = piece;
  newBoard[move.from.r][move.from.c] = null;

  // Promoção a rei
  if (piece === "red" && move.to.r === 0)
    newBoard[move.to.r][move.to.c] = "red-king";
  if (piece === "black" && move.to.r === BOARD_SIZE - 1)
    newBoard[move.to.r][move.to.c] = "black-king";

  // Remover peça(s) capturada(s)
  if (move.capture) {
    if (typeof move.capture === "object") {
      // Captura de rainha (posição)
      newBoard[move.capture.r][move.capture.c] = null;
    } else {
      // Captura normal (boolean ou undefined)
      const mr = move.from.r + (move.to.r - move.from.r) / 2;
      const mc = move.from.c + (move.to.c - move.from.c) / 2;
      newBoard[Math.floor(mr)][Math.floor(mc)] = null;
    }
  }

  return newBoard;
}

function countPieces(board: Board, color: "red" | "black"): number {
  let count = 0;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const piece = board[r][c];
      if (piece && getPieceColor(piece) === color) count++;
    }
  }
  return count;
}

export default function Checkers({
  personId,
  onFinish,
}: {
  personId?: number;
  onFinish?: (winner: "player" | "samurai" | "draw", score: number) => void;
}) {
  const [board, setBoard] = useState<Board>(initialBoard());
  const [turn, setTurn] = useState<"red" | "black">("red");
  const [selected, setSelected] = useState<Position | null>(null);
  const [winner, setWinner] = useState<"red" | "black" | "draw" | null>(null);
  const [loading, setLoading] = useState(false);
  const [samuraiMovePending, setSamuraiMovePending] = useState(false);
  const [mustCaptureFrom, setMustCaptureFrom] = useState<Position | null>(null);

  // Obter movimentos válidos para a peça seleccionada
  const validMoves = React.useMemo(() => {
    if (!selected) return [];
    const piece = board[selected.r][selected.c];
    if (!piece) return [];

    const allMoves = getMovesForPiece(board, selected, piece);

    // Se há capturas disponíveis em qualquer lado, só permitir capturas
    const allPlayerMoves = getAllMoves(board, turn);
    const hasCapture = hasCaptures(allPlayerMoves);

    if (hasCapture) {
      return allMoves.filter((m) => m.capture);
    }

    return allMoves;
  }, [selected, board, turn]);

  // IA do Samurai
  useEffect(() => {
    if (winner || turn !== "black" || !samuraiMovePending) return;

    const timer = setTimeout(() => {
      const allMoves = getAllMoves(board, "black");

      if (allMoves.length === 0) {
        setWinner("red");
        setSamuraiMovePending(false);
        return;
      }

      // Priorizar capturas
      const captureMoves = allMoves.filter((m) => m.capture);

      let chosenMove;
      if (captureMoves.length > 0) {
        // Escolher captura que promove a rei se possível
        const promotionCaptures = captureMoves.filter(
          (m) =>
            board[m.from.r][m.from.c] === "black" && m.to.r === BOARD_SIZE - 1,
        );
        chosenMove =
          promotionCaptures.length > 0
            ? promotionCaptures[
                Math.floor(Math.random() * promotionCaptures.length)
              ]
            : captureMoves[Math.floor(Math.random() * captureMoves.length)];
      } else {
        // Priorizar promoções a rei
        const promotionMoves = allMoves.filter(
          (m) =>
            board[m.from.r][m.from.c] === "black" && m.to.r === BOARD_SIZE - 1,
        );

        if (promotionMoves.length > 0 && Math.random() < 0.6) {
          chosenMove =
            promotionMoves[Math.floor(Math.random() * promotionMoves.length)];
        } else {
          // Movimento aleatório com preferência pelo centro
          const centerMoves = allMoves.filter(
            (m) => m.to.c >= 2 && m.to.c <= 5,
          );
          chosenMove =
            centerMoves.length > 0 && Math.random() < 0.5
              ? centerMoves[Math.floor(Math.random() * centerMoves.length)]
              : allMoves[Math.floor(Math.random() * allMoves.length)];
        }
      }

      const newBoard = makeMove(board, chosenMove);
      setBoard(newBoard);

      // Verificar captura múltipla
      if (chosenMove.capture) {
        const piece = newBoard[chosenMove.to.r][chosenMove.to.c]!;
        const followUpMoves = getMovesForPiece(newBoard, chosenMove.to, piece);
        const canCaptureMore = followUpMoves.some((m) => m.capture);

        if (canCaptureMore) {
          // Samurai continua a jogar
          setMustCaptureFrom(chosenMove.to);
          setTimeout(() => {
            const followUpCaptures = followUpMoves.filter((m) => m.capture);
            if (followUpCaptures.length > 0) {
              const followUp =
                followUpCaptures[
                  Math.floor(Math.random() * followUpCaptures.length)
                ];
              const afterFollowUp = makeMove(newBoard, followUp);
              setBoard(afterFollowUp);
              setTurn("red");
              setSamuraiMovePending(false);
              setMustCaptureFrom(null);
            }
          }, 400);
          return;
        }
      }

      setTurn("red");
      setSamuraiMovePending(false);
      setMustCaptureFrom(null);

      // Verificar vitória
      const redCount = countPieces(newBoard, "red");
      const blackCount = countPieces(newBoard, "black");

      if (redCount === 0) setWinner("black");
      else if (blackCount === 0) setWinner("red");
      else if (
        !hasCaptures(getAllMoves(newBoard, "red")) &&
        getAllMoves(newBoard, "red").length === 0
      ) {
        setWinner("black");
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [board, turn, winner, samuraiMovePending]);

  async function finishGame() {
    if (!winner) return;
    if (winner === "draw") return onFinish?.("draw", 0);

    const outcome = winner === "red" ? "win" : "lose";
    const score = winner === "red" ? 1 : 0;

    if (!personId)
      return onFinish?.(winner === "red" ? "player" : "samurai", 0);

    setLoading(true);
    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game: "checkers", score, personId, outcome }),
      });
      const j = await res.json();
      onFinish?.(winner === "red" ? "player" : "samurai", j?.coinsAwarded ?? 0);
    } catch {
      onFinish?.(winner === "red" ? "player" : "samurai", 0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (winner) finishGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [winner]);

  function handleClick(r: number, c: number) {
    if (winner || turn !== "red" || samuraiMovePending) return;

    const piece = board[r][c];
    const isOwnPiece = piece && getPieceColor(piece) === "red";

    // Se deve continuar de uma captura múltipla
    if (mustCaptureFrom) {
      const move = validMoves.find((m) => m.to.r === r && m.to.c === c);
      if (
        move &&
        move.from.r === mustCaptureFrom.r &&
        move.from.c === mustCaptureFrom.c
      ) {
        const newBoard = makeMove(board, move);
        setBoard(newBoard);

        // Verificar se pode capturar mais
        const movedPiece = newBoard[move.to.r][move.to.c]!;
        const followUpMoves = getMovesForPiece(newBoard, move.to, movedPiece);
        const canCaptureMore = followUpMoves.some((m) => m.capture);

        if (canCaptureMore) {
          setMustCaptureFrom(move.to);
          setSelected(move.to);
        } else {
          setTurn("black");
          setSamuraiMovePending(true);
          setMustCaptureFrom(null);
          setSelected(null);
        }
      }
      return;
    }

    if (selected) {
      const move = validMoves.find((m) => m.to.r === r && m.to.c === c);
      if (move) {
        const newBoard = makeMove(board, move);
        setBoard(newBoard);
        setSelected(null);

        // Verificar captura múltipla
        if (move.capture) {
          const movedPiece = newBoard[move.to.r][move.to.c]!;
          const followUpMoves = getMovesForPiece(newBoard, move.to, movedPiece);
          const canCaptureMore = followUpMoves.some((m) => m.capture);

          if (canCaptureMore) {
            setMustCaptureFrom(move.to);
            setSelected(move.to);
            return;
          }
        }

        setTurn("black");
        setSamuraiMovePending(true);
        return;
      }
    }

    // Selecionar peça
    if (isOwnPiece) {
      // Se há capturas disponíveis, só permitir seleccionar peças que podem capturar
      const allMoves = getAllMoves(board, "red");
      const hasCapture = hasCaptures(allMoves);

      if (hasCapture) {
        const canCapture = getMovesForPiece(board, { r, c }, piece!).some(
          (m) => m.capture,
        );
        if (!canCapture) return;
      }

      setSelected({ r, c });
    } else {
      setSelected(null);
    }
  }

  function reset() {
    setBoard(initialBoard());
    setTurn("red");
    setSelected(null);
    setWinner(null);
    setSamuraiMovePending(false);
    setMustCaptureFrom(null);
  }

  const redCount = countPieces(board, "red");
  const blackCount = countPieces(board, "black");

  const status = winner
    ? winner === "draw"
      ? "Empate!"
      : winner === "red"
        ? "🎉 Ganhaste!"
        : "Samurai venceu!"
    : turn === "red"
      ? `A tua vez (vermelhas) - ${redCount} peças`
      : `Vez do Samurai... - ${blackCount} peças`;

  const allRedMoves = getAllMoves(board, "red");
  const hasCapture = hasCaptures(allRedMoves);

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 12,
        background: "var(--card-bg)",
        color: "var(--foreground)",
        textAlign: "center",
      }}
    >
      <h4 style={{ margin: "0 0 12px 0" }}>♟️ Damas — Tu vs Samurai</h4>

      <div style={{ marginBottom: 12, color: "var(--muted)", fontSize: 14 }}>
        {status}
        {hasCapture && turn === "red" && (
          <div style={{ color: "#ef4444", fontWeight: 600, marginTop: 4 }}>
            ⚠️ Captura obrigatória!
          </div>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${BOARD_SIZE}, 45px)`,
          gap: 0,
          margin: "0 auto",
          border: "4px solid #4b5563",
          borderRadius: 4,
          background: "#4b5563",
        }}
      >
        {Array.from({ length: BOARD_SIZE }).map((_, r) =>
          Array.from({ length: BOARD_SIZE }).map((_, c) => {
            const isDark = (r + c) % 2 === 1;
            const piece = board[r][c];
            const isSelected = selected?.r === r && selected?.c === c;
            const isValidMove = validMoves.some(
              (m) => m.to.r === r && m.to.c === c,
            );
            const isMustCapture =
              mustCaptureFrom?.r === r && mustCaptureFrom?.c === c;

            return (
              <div
                key={`${r}-${c}`}
                onClick={() => handleClick(r, c)}
                style={{
                  width: 45,
                  height: 45,
                  background: isDark ? "#374151" : "#f3f4f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor:
                    (piece?.startsWith(turn) && turn === "red") || isValidMove
                      ? "pointer"
                      : "default",
                  position: "relative",
                }}
              >
                {isValidMove && (
                  <div
                    style={{
                      width: 15,
                      height: 15,
                      borderRadius: "50%",
                      background: piece
                        ? "rgba(239, 68, 68, 0.8)"
                        : "rgba(34, 197, 94, 0.6)",
                      position: "absolute",
                      border: piece ? "2px solid #ef4444" : "none",
                    }}
                  />
                )}

                {piece && (
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: piece?.startsWith("red")
                        ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                        : "linear-gradient(135deg, #1f2937 0%, #000000 100%)",
                      border: piece?.includes("king")
                        ? "3px solid #fbbf24"
                        : "2px solid rgba(255,255,255,0.2)",
                      boxShadow:
                        isSelected || isMustCapture
                          ? "0 0 15px rgba(59, 130, 246, 0.8)"
                          : "0 2px 8px rgba(0,0,0,0.4)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      transition: "transform 0.2s ease",
                      transform:
                        isSelected || isMustCapture
                          ? "scale(1.15)"
                          : "scale(1)",
                      color: "#fff",
                      fontWeight: "bold",
                    }}
                  >
                    {piece?.includes("king") && "👑"}
                  </div>
                )}
              </div>
            );
          }),
        )}
      </div>

      {winner && (
        <div style={{ marginTop: 16 }}>
          <button
            onClick={reset}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              background: "var(--accent)",
              color: "white",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            🔄 Jogar Novamente
          </button>
        </div>
      )}

      <div style={{ marginTop: 12, fontSize: 11, color: "var(--muted)" }}>
        📌 Capturas são obrigatórias • Capturas múltiplas também • Reis movem-se
        para trás
      </div>
    </div>
  );
}
