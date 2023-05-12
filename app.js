const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertPlayerDetailsDbObjectToResponseObject = (dbObject) => {
  return {
    PlayerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDetailsDbObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};
const convertPlayerMatchScoreDbObjectToResponseObject = (dbObject) => {
  return {
    playerMatchId: dbObject.player_match_id,
    PlayerId: dbObject.player_id,
    matchId: dbObject.match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};

app.get("/players/", async (request, response) => {
  const getMoviesQuery = `
    SELECT
      *
    FROM
      player_details;`;
  const moviesArray = await database.all(getMoviesQuery);
  moviesArray.map((eachPlayer) =>
    convertPlayerDetailsDbObjectToResponseObject(eachPlayer)
  );
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getMovieQuery = `
    SELECT 
      *
    FROM 
      player_details
    WHERE 
      player_id = ${playerId};`;
  const movie = await database.get(getMovieQuery);
  response.send(convertPlayerDetailsDbObjectToResponseObject(movie));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId, playerName } = request.body;

  const updateMovieQuery = `
            UPDATE
              player_details
            SET
              player_id = ${playerId},
              player_name = '${playerName}'
            WHERE
              player_id = ${playerId};`;

  await database.run(updateMovieQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMovieQuery = `
    SELECT 
      *
    FROM 
      match_details
    WHERE 
      match_id = ${matchId};`;
  const movie = await database.get(getMovieQuery);
  response.send(convertMatchDetailsDbObjectToResponseObject(movie));
});

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getDirectorMoviesQuery = `
    SELECT
      match_id,match,year
    FROM
      match_details natural join player_match_score
    WHERE
      player_id='${playerId}';`;
  const moviesArray = await database.all(getDirectorMoviesQuery);
  response.send(
    moviesArray.map((eachMovie) =>
      convertMatchDetailsDbObjectToResponseObject(eachMovie)
    )
  );
});

app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getDirectorMoviesQuery = `
    SELECT
     player_id,player_name
    FROM
      player_details natural join player_match_score
    WHERE
      match_id='${matchId}';`;
  const moviesArray = await database.all(getDirectorMoviesQuery);
  response.send(
    moviesArray.map((eachMovie) =>
      convertPlayerDetailsDbObjectToResponseObject(eachMovie)
    )
  );
});

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getMovieQuery = `
    SELECT 
      player_id,player_name,
      SUM(score),
      SUM(fours),
      SUM(sixes)
    FROM 
      player_match_score natural join player_details
    WHERE 
      player_id = ${playerId};`;

  const playerScores = await database.get(getMovieQuery);
  console.log(playerScores);
  response.send({
    playerId: playerScores["player_id"],
    playerName: playerScores["player_name"],
    totalScore: playerScores["SUM(score)"],
    totalFours: playerScores["SUM(fours)"],
    totalSixes: playerScores["SUM(sixes)"],
  });
});

module.exports = app;
