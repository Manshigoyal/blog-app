const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcrypt");
const session = require("express-session");

const app = express();


// ===================================
// MIDDLEWARE
// ===================================

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));

app.set("view engine", "ejs");

app.use(session({

    secret: "blogsecretkey",

    resave: false,

    saveUninitialized: false

}));


// ===================================
// DATABASE CONNECTION
// ===================================

mongoose.connect("mongodb+srv://manshigoyal06_db_user:tcW5I4zOlCHx5246@cluster0.c0geh5c.mongodb.net/blogDB?retryWrites=true&w=majority")

.then(() => {

    console.log("MongoDB Atlas Connected");

})

.catch((err) => {

    console.log(err);

});


// ===================================
// MODELS
// ===================================

const Blog = require("./models/Blog");

const User = require("./models/User");


// ===================================
// MULTER CONFIGURATION
// ===================================

const storage = multer.diskStorage({

    destination: function (req, file, cb) {

        cb(null, "public/uploads");

    },

    filename: function (req, file, cb) {

        cb(null, Date.now() + path.extname(file.originalname));

    }

});

const upload = multer({

    storage: storage

});


// ===================================
// HOME PAGE
// ===================================

app.get("/", async (req, res) => {

    try {

        const blogs = await Blog.find().sort({

            createdAt: -1

        });

        res.render("index", { blogs });

    }

    catch (error) {

        console.log(error);

    }

});


// ===================================
// SEARCH BLOG
// ===================================

app.get("/search", async (req, res) => {

    try {

        const query = req.query.q;

        const blogs = await Blog.find({

            $or: [

                {

                    title: {

                        $regex: query,

                        $options: "i"

                    }

                },

                {

                    category: {

                        $regex: query,

                        $options: "i"

                    }

                }

            ]

        });

        res.render("index", { blogs });

    }

    catch (error) {

        console.log(error);

    }

});


// ===================================
// ADD BLOG PAGE
// ===================================

app.get("/add", (req, res) => {

    if (!req.session.userId) {

        return res.redirect("/login");

    }

    res.render("add");

});


// ===================================
// SAVE BLOG
// ===================================

app.post("/add", upload.single("image"), async (req, res) => {

    try {

        if (!req.session.userId) {

            return res.redirect("/login");

        }

        const user = await User.findById(req.session.userId);

        const newBlog = new Blog({

            title: req.body.title,

            image: req.file.filename,

            content: req.body.content,

            category: req.body.category,

            author: user.username,

            likes: 0,

            comments: []

        });

        await newBlog.save();

        res.redirect("/");

    }

    catch (error) {

        console.log(error);

    }

});


// ===================================
// EDIT BLOG PAGE
// ===================================

app.get("/edit/:id", async (req, res) => {

    try {

        const blog = await Blog.findById(req.params.id);

        res.render("edit", { blog });

    }

    catch (error) {

        console.log(error);

    }

});


// ===================================
// UPDATE BLOG
// ===================================

app.post("/edit/:id", upload.single("image"), async (req, res) => {

    try {

        let updatedData = {

            title: req.body.title,

            content: req.body.content,

            category: req.body.category

        };

        if (req.file) {

            updatedData.image = req.file.filename;

        }

        await Blog.findByIdAndUpdate(

            req.params.id,

            updatedData

        );

        res.redirect("/");

    }

    catch (error) {

        console.log(error);

    }

});


// ===================================
// DELETE BLOG
// ===================================

app.get("/delete/:id", async (req, res) => {

    try {

        await Blog.findByIdAndDelete(req.params.id);

        res.redirect("/");

    }

    catch (error) {

        console.log(error);

    }

});


// ===================================
// LIKE BLOG
// ===================================

app.get("/like/:id", async (req, res) => {

    try {

        const blog = await Blog.findById(req.params.id);

        blog.likes += 1;

        await blog.save();

        res.redirect("/");

    }

    catch (error) {

        console.log(error);

    }

});


// ===================================
// ADD COMMENT
// ===================================

app.post("/comment/:id", async (req, res) => {

    try {

        const blog = await Blog.findById(req.params.id);

        blog.comments.push({

            text: req.body.comment

        });

        await blog.save();

        res.redirect("/");

    }

    catch (error) {

        console.log(error);

    }

});


// ===================================
// REGISTER PAGE
// ===================================

app.get("/register", (req, res) => {

    res.render("register");

});


// ===================================
// REGISTER USER
// ===================================

app.post("/register", upload.single("profileImage"), async (req, res) => {

    try {

        const hashedPassword = await bcrypt.hash(

            req.body.password,

            10

        );

        const newUser = new User({

            username: req.body.username,

            email: req.body.email,

            password: hashedPassword,

            bio: req.body.bio,

            profileImage: req.file ? req.file.filename : ""

        });

        await newUser.save();

        res.redirect("/login");

    }

    catch (error) {

        console.log(error);

    }

});


// ===================================
// LOGIN PAGE
// ===================================

app.get("/login", (req, res) => {

    res.render("login");

});


// ===================================
// LOGIN USER
// ===================================

app.post("/login", async (req, res) => {

    try {

        const user = await User.findOne({

            email: req.body.email

        });

        if (!user) {

            return res.send("User Not Found");

        }

        const isMatch = await bcrypt.compare(

            req.body.password,

            user.password

        );

        if (!isMatch) {

            return res.send("Wrong Password");

        }

        req.session.userId = user._id;

        res.redirect("/");

    }

    catch (error) {

        console.log(error);

    }

});


// ===================================
// LOGOUT
// ===================================

app.get("/logout", (req, res) => {

    req.session.destroy(() => {

        res.redirect("/login");

    });

});


// ===================================
// SERVER
// ===================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(`Server Running on Port ${PORT}`);

});