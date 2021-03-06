import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useLayoutEffect,
} from "react";
import { Center, Box, HStack, VStack, useColorModeValue } from "native-base";
import Board from "./Board";
import { ICoord } from "../../types/ICoord";
import Board3by3Drawish from "../../images/Board/Board3by3Drawish";
import Board3by3Straight from "../../images/Board/Board3by3Straight";
import CurrentPlaying from "./CurrentPlaying";
import { CommonActions } from "@react-navigation/native";

const THREE = 3;

const optionsPlayerMarkEnum = ["O" as any, "X" as any];

interface TTTGameProps {
  options: {
    startMark: number;
    playerMark: number;
    boardDesign: number;
    playingVsAI: boolean;
  };
  navToWinnerScreen: (winnerMark: any) => void;
  navigation?: any;
}

export interface SquareData {
  mark: any;
  isAI: boolean;
}

interface BoardData {
  key: string;
  isPlayable: boolean;
  playerWonMark: any;
  boardId: ICoord;
  squares: SquareData[][];
}

export const getMarkColor = (mark: any): string => {
  return mark === "O"
    ? "#1a91ff" // => darkBlue.400
    : mark === "X"
    ? "#f97316" // => orange.500 OR #dc2626 => red.600
    : mark === "D"
    ? "#737373" // => trueGray.500
    : useColorModeValue("#000", "#fff");
};

const TTTGame = ({ options, navToWinnerScreen, navigation }: TTTGameProps) => {
  const playerMark = useRef<any>(optionsPlayerMarkEnum[options.playerMark]);
  const winner = useRef<any>("");
  const isPlayingAI = options.playingVsAI;

  const getEmptySquares = (): SquareData[][] => [
    [
      { mark: "", isAI: false },
      { mark: "", isAI: false },
      { mark: "", isAI: false },
    ],
    [
      { mark: "", isAI: false },
      { mark: "", isAI: false },
      { mark: "", isAI: false },
    ],
    [
      { mark: "", isAI: false },
      { mark: "", isAI: false },
      { mark: "", isAI: false },
    ],
  ];

  const initBoards = () => {
    const initialBoards = [];
    for (let i = 0; i < THREE; i++) {
      let row = [];
      for (let j = 0; j < THREE; j++) {
        row.push({
          key: `${i}-${j}`,
          isPlayable: true,
          playerWonMark: "" as any,
          boardId: { i, j } as ICoord,
          squares: getEmptySquares(),
        });
      }
      initialBoards.push(row);
    }
    return initialBoards;
  };
  const [boards, setBoards] = useState<BoardData[][]>(initBoards());

  useEffect(() => {
    if (options.startMark === 1) {
      const newBoards = boards.slice();
      randomPlayAI(newBoards);
      setBoards(newBoards);
    }
  }, []);

  const getRandomInt = (min: number, max: number) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const nextPlayerMark = () => {
    return playerMark.current === "O" ? "X" : "O";
  };

  const updatePlayableBoards = (
    newBoards: BoardData[][],
    i: number,
    j: number
  ) => {
    newBoards.map((row) => {
      row.map((v) => {
        return Object.assign(v, { isPlayable: false });
      });
    });

    if (newBoards[i][j].playerWonMark) {
      newBoards.map((row) => {
        row.map((v) => {
          if (!v.playerWonMark) {
            return Object.assign(v, { isPlayable: true });
          }
        });
      });
    } else {
      newBoards[i][j].isPlayable = true;
    }

    return newBoards;
  };

  const handleWinner = (winner9x9: any) => {
    console.log(`The Game finished, player ${winner9x9} won`);
    winner.current = winner9x9;
    navToWinnerScreen(winner9x9);
  };

  const checkWinner = (
    newBoards: BoardData[][],
    boardId: ICoord,
    i: number,
    j: number,
    currentPlayerMark: any
  ) => {
    const didWin = boardResultMark(boardId, i, j, currentPlayerMark);

    if (didWin) {
      newBoards[boardId.i][boardId.j].playerWonMark = didWin;
      const winner9x9 = board9x9ResultMark(
        boardId.i,
        boardId.j,
        currentPlayerMark
      );
      if (winner9x9) {
        handleWinner(winner9x9);
      }
    }
  };

  const handleTurn = (
    newBoards: BoardData[][],
    boardId: ICoord,
    i: number,
    j: number,
    currentPlayerMark: any,
    isAI: boolean = false
  ) => {
    updateSquare(newBoards, boardId, i, j, currentPlayerMark, isAI);

    checkWinner(newBoards, boardId, i, j, currentPlayerMark);

    updatePlayableBoards(newBoards, i, j);
  };

  const boardResultMark = (
    boardId: ICoord,
    row: number,
    col: number,
    currentPlayerMark: any
  ): any => {
    /*
    returns winner Mark === 'O' || 'X', if there is a winner
    returns markEnum.DRAW === 'D',      if there is a draw
    returns markEnum.EMPTY === '' ,     if it its still playable
    */
    const currentSquares = boards[boardId.i][boardId.j].squares;

    for (var k = 0; k < THREE; k++) {
      if (
        currentSquares[row][k].mark === "" ||
        currentSquares[row][k].mark !== currentPlayerMark
      ) {
        break;
      }
    }
    if (k === THREE) {
      return currentPlayerMark;
    }

    for (var k = 0; k < THREE; k++) {
      if (
        currentSquares[k][col].mark === "" ||
        currentSquares[k][col].mark !== currentPlayerMark
      ) {
        break;
      }
    }
    if (k === THREE) {
      return currentPlayerMark;
    }

    for (var k = 0; k < THREE; k++) {
      if (
        currentSquares[k][k].mark === "" ||
        currentSquares[k][k].mark !== currentPlayerMark
      ) {
        break;
      }
    }
    if (k === THREE) {
      return currentPlayerMark;
    }

    for (var k = 0; k < THREE; k++) {
      if (
        currentSquares[THREE - k - 1][k].mark === "" ||
        currentSquares[THREE - k - 1][k].mark !== currentPlayerMark
      ) {
        break;
      }
    }
    if (k === THREE) {
      return currentPlayerMark;
    }

    for (let row of currentSquares) {
      for (let squareData of row) {
        if (!squareData.mark) return "";
      }
    }

    return "D";
  };

  const board9x9ResultMark = (
    row: number,
    col: number,
    currentPlayerMark: any
  ): any => {
    /*
    returns winner Mark === 'O' || 'X', if there is a winner
    returns markEnum.DRAW === 'D',      if there is a draw
    returns markEnum.EMPTY === '' ,     if it its still playable 
    */
    for (var k = 0; k < THREE; k++) {
      if (
        boards[row][k].playerWonMark === "" ||
        boards[row][k].playerWonMark !== currentPlayerMark
      ) {
        break;
      }
    }
    if (k === THREE) {
      return currentPlayerMark;
    }

    for (var k = 0; k < THREE; k++) {
      if (
        boards[k][col].playerWonMark === "" ||
        boards[k][col].playerWonMark !== currentPlayerMark
      ) {
        break;
      }
    }
    if (k === THREE) {
      return currentPlayerMark;
    }

    for (var k = 0; k < THREE; k++) {
      if (
        boards[k][k].playerWonMark === "" ||
        boards[k][k].playerWonMark !== currentPlayerMark
      ) {
        break;
      }
    }
    if (k === THREE) {
      return currentPlayerMark;
    }

    for (var k = 0; k < THREE; k++) {
      if (
        boards[THREE - k - 1][k].playerWonMark === "" ||
        boards[THREE - k - 1][k].playerWonMark !== currentPlayerMark
      ) {
        break;
      }
    }
    if (k === THREE) {
      return currentPlayerMark;
    }

    for (let row of boards) {
      for (let mark of row) {
        if (!mark.playerWonMark) return "";
      }
    }

    return "D";
  };

  const getPlayableSquares = (currentBoards: BoardData[][]) => {
    let playableSquares: { boardId: ICoord; j: number; i: number }[] = [];

    currentBoards.forEach((row) => {
      row.forEach((board) => {
        if (board.isPlayable && !board.playerWonMark) {
          board.squares.forEach((squareRow, i) => {
            squareRow.forEach((square, j) => {
              if (!square.mark) {
                playableSquares.push({ boardId: board.boardId, i: i, j: j });
              }
            });
          });
        }
      });
    });

    return playableSquares;
  };
  const randomPlayAI = (currentBoards: BoardData[][]) => {
    const playableSquares = getPlayableSquares(currentBoards);

    const randomSquare =
      playableSquares[getRandomInt(0, playableSquares.length - 1)];

    // play on that square
    if (randomSquare) {
      handleTurn(
        currentBoards,
        randomSquare.boardId,
        randomSquare.i,
        randomSquare.j,
        playerMark.current,
        true
      );
    }
  };

  const updateSquare = (
    newBoards: BoardData[][],
    boardId: ICoord,
    i: number,
    j: number,
    currentPlayerMark: any,
    isAI: boolean = false
  ) => {
    const squareToUpdate = newBoards[boardId.i][boardId.j].squares[i][j];
    if (squareToUpdate.mark) return;

    squareToUpdate.mark = currentPlayerMark;
    squareToUpdate.isAI = isAI;
  };

  const isBoardPlayable = (boardId: ICoord): boolean => {
    // to prevent to play after someone wins
    if (winner.current) return false;

    const board = boards[boardId.i][boardId.j];
    if (board.playerWonMark || !board.isPlayable) return false;
    return true;
  };

  const onSquarePress = useCallback((boardId: ICoord, i: number, j: number) => {
    if (!isBoardPlayable(boardId)) {
      return;
    }

    let newBoards = boards.slice();

    handleTurn(newBoards, boardId, i, j, playerMark.current);

    playerMark.current = nextPlayerMark();

    if (isPlayingAI && !winner.current) {
      randomPlayAI(newBoards);
      playerMark.current = nextPlayerMark();
    }

    setBoards(newBoards);
  }, []);

  return (
    <>
      <VStack>
        {!isPlayingAI ? (
          <CurrentPlaying
            playerMark={playerMark.current}
            color={getMarkColor(playerMark.current)}
          />
        ) : null}

        <Center>
          <Box position="absolute" h="100%" w="100%">
            {options.boardDesign === 0 ? (
              <Board3by3Straight stroke={getMarkColor(winner.current)} />
            ) : (
              <Board3by3Drawish stroke={getMarkColor(winner.current)} />
            )}
          </Box>
          {boards.map((row, i) => (
            <HStack key={i}>
              {row.map((v) => (
                <Board
                  key={v.key}
                  id={v.boardId}
                  squares={v.squares}
                  isPlayable={v.isPlayable}
                  playerWonMark={v.playerWonMark}
                  isBoardDesignStraight={options.boardDesign === 0}
                  onSquarePress={onSquarePress}
                />
              ))}
            </HStack>
          ))}
        </Center>
      </VStack>
    </>
  );
};

export default TTTGame;
