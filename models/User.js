const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

    username: String,

    email: String,

    password: String,

    bio: String,

    profileImage: String

});

module.exports = mongoose.model("User", userSchema);