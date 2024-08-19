// cors-cross origin specification policy
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");
const express = require("express");
const trackRoute = express.Router();
const generateJWT = require("./jwt.js");
trackRoute.use(cors({ origin: true }));
const multer = require("multer");
const jwt = require("jsonwebtoken");

const mongodb = require("mongodb");
var mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/trackDB", {
  useNewUrlParser: true,
});
var conn = mongoose.connection;
conn.on("connected", function () {
  console.log("database is connected successfully");
});
conn.on("disconnected", function () {
  console.log("database is disconnected successfully");
});
conn.on("error", console.error.bind(console, "connection error:"));
// module.exports = conn;
const fs = require("fs");
const fsExtra = require("fs-extra");

var songModel = require("./Models/songModel");
// multer store 
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
var upload = multer({ storage: storage, preservePath: true });

/**
 * NodeJS Module dependencies.
 */
//const { Readable } = require("stream");

/**
 * Create Express server && Express Router configuration.
 */
const app = express();
app.use("/tracks", trackRoute);

//Get JWt
trackRoute.get("/getjwt", generateJWT);

/**
 * GET /tracks/:trackID
 */
trackRoute.get("/:trackID", async (req, res) => {
  let tokenHeaderKey = process.env.TOKEN_HEADER_KEY;
  let jwtSecretKey = process.env.JWT_SECRET_KEY;
  try {
    const token = req.header(tokenHeaderKey);

    const verified = jwt.verify(token, jwtSecretKey);
    if (verified) {
      try {
        var trackID = new mongodb.ObjectId(req.params.trackID);
      } catch (err) {
        return res.status(400).json({
          message:
            "Invalid trackID in URL parameter. Must be a single String of 12 bytes or a string of 24 hex characters",
        });
      }
      await songModel.findOne(trackID).then((songResponse) => {
        console.log(songResponse.name);
        res.set("content-type", songResponse.song.contentType);
        console.log(`./uploads/${songResponse.uploadPath}`);
        // res.sendFile(`./uploads/${songResponse.uploadPath}`, { root: "." });
        res.send(songResponse.song.data);
      });
    }
  } catch (error) {
    // Access Denied
    return res.status(401).send(error);
  }

  // res.set("accept-ranges", "bytes");

  // res.json(mySong.name());
  // console.log(mySong.schema.obj.name);
  // console.log(mySong.name);
  // res.sendFile(`./uploads/${mySong.song.data}`);
});

/**
 * DELETE /tracks/:trackID
 */
trackRoute.delete("/:trackID", async (req, res) => {
  console.log(req.params.trackID);
  try {
    var trackID = new mongodb.ObjectId(req.params.trackID);
  } catch (err) {
    return res.status(400).json({
      message:
        "Invalid trackID in URL parameter. Must be a single String of 12 bytes or a string of 24 hex characters",
    });
  }
  await songModel.findOne(trackID).then(async (songResponse) => {
    console.log(songResponse.name);
    // res.sendFile(`./uploads/${songResponse.uploadPath}`, { root: "." });
    await songModel.deleteOne({ _id: trackID }).then(() => {
      fsExtra.remove(
        `C:\\Users\\athar\\Downloads\\nodeMongoAudioUploadStreamTest 2\\nodeMongoAudioUploadStreamTest\\uploads\\${songResponse.name}`,
        (err) => {
          console.error(err);
        }
      );
      res.json({ message: "File Deleted Successfully" });
    });
  });
  // res.json(mySong.name());
  // console.log(mySong.schema.obj.name);
  // console.log(mySong.name);
  // res.sendFile(`./uploads/${mySong.song.data}`);
});

/**
 * POST /tracks
 */

trackRoute.post("/", upload.single("mySong"), (req, res) => {
  var song = fs.readFileSync(req.file.path);
  // if (req.file.mimetype != "audio") {
  // }
  var encoded_song = song.toString("base64");
  var final_song = {
    name: req.file.originalname,
    uploadPath: req.file.filename,
    song: {
      contentType: req.file.mimetype,
      data: Buffer.from(encoded_song, "base64"),
    },
  };
  // console.log(final_song);

  songModel.create(final_song, function (err, result) {
    if (err) {
      console.log(err);
    } else {
      // console.log(result);
      console.log(final_song.name + " Saved To database on " + Date.now());
      res.json({
        message: "Uploaded successfully",
        fileName: req.file.filename,
        id: result._id,
      });
    }
  });
});

app.listen(3005, () => {
  console.log("App listening on port 3005!");
});
