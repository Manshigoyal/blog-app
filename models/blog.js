const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema({

    title: String,

    image: String,

    content: String,

    category: String,

    author: String,

    likes: {

        type: Number,

        default: 0

    },

    comments: [

        {

            text: String

        }

    ],

    createdAt: {

        type: Date,

        default: Date.now

    }

});

module.exports = mongoose.model("Blog", blogSchema);