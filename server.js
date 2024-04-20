const express = require("express");
const sgMail = require("@sendgrid/mail");
const Post = require("./post");
const swagger = require("./utils/swagger");

require("dotenv").config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const app = express();
const PORT = process.env.PORT || 5000;

app.get("/", async (req, res) => {
  res.json({ message: "Welcome 😃" });
});

app.post("/api/mail", async (req, res) => {
  // SENDING SMtp

  const { msg, to, subject, text } = req.query;

  // VERIFYING REQUIRED INPUT
  if (!msg || !to || !subject) {
    return res.status(400).json({
      message: `Missing required input`,
      status: false,
    });
  }
  const mailMsg = {
    to: to,
    from: "troctowork@gmail.com",
    subject: subject,
    text: text,
    html: msg,
  };

  const senndMail = async () => {
    try {
      await sgMail.send(mailMsg);
      res.status(200).json({ message: "Mail sent" });
    } catch (error) {
      console.error(error);

      if (error.response) {
        console.error(error.response.body);
      }
      res.status(500);
    }
  };

  senndMail();
});

app.get("/api/posts", async (req, res) => {
  // Define a GET route for the /posts endpoint
  // Use the Post model to find all posts and return them as a JSON response with pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const posts = await Post.findAndCountAll({
    offset,
    limit,
  });

  res.status(200).json({
    status: true,
    message: `${posts.rows.length} posts fetched successfully`,
    data: posts.rows,
    meta: {
      total: posts.count,
      page,
      limit,
      totalPages: Math.ceil(posts.count / limit),
    },
  });
});

app.post("/api/save-data", async (req, res) => {
  const { text, image } = req.query;

  try {
    const newPost = await Post.create({ text, image });

    res.status(200).json({
      status: true,
      message: `Post added to db`,
      data: newPost,
    });
  } catch (error) {
    console.log("Error occured on the server while saving post to db", error);

    res.status(500).json({
      status: false,
      message: `Error occured`,
    });
  }
});

swagger(app);

app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});
