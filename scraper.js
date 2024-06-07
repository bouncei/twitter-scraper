const puppeteer = require("puppeteer");
const cron = require("node-cron");
const axios = require("axios");

require("dotenv").config();

const randomIntFromInterval = (min, max) => {
  return Math.floor(Math.random() * (max - min) + min);
};

const sleep_for = async (page, min, max) => {
  let sleep_duration = randomIntFromInterval(min, max);
  console.log("Waiting for ", sleep_duration / 100, `seconds`);

  return new Promise((resolve) => setTimeout(resolve, sleep_duration));
};

const sendMail = async (to) => {
  try {
    const query = {
      to,
      subject: "Video Spotted",
      text: "There is a video presnt in the list of CoinDesk posts on X(formerly Twitter).",
      msg: "<p>There is a video presnt in the list of CoinDesk posts on X(formerly Twitter).</p>",
    };

    const response = await axios.post(
      `https://twitter-scraper-n6ac.onrender.com/api/mail?to=${query.to}&subject=${query.subject}&text=${query.text}&msg=${query.msg}`,

      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    console.log(response.data);
  } catch (error) {
    console.log("Error occured while sending mail: ", error);
  }
};

// Function to save scraped data to PostgreSQL via REST API
async function saveToDatabase({ text, image }) {
  try {
    const response = await axios.post(
      `https://twitter-scraper-n6ac.onrender.com/api/save-data?text=${text}&image=${image}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error saving data to database:", error);
  }
}

// Function to scrape tweets from CoinDesk Twitter channel
async function scrapeCoinDeskTweets() {
  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.setViewport({
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
    });

    await page.goto("https://twitter.com/coindesk", {
      waitUntil: "networkidle2",
    });

    await sleep_for(page, 1000, 4000);

    // Scroll to the end of the page
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    await sleep_for(page, 1000, 4000);

    // Scroll to the end of the page
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    const tweetDivs = await page.$$(
      `div[data-testid="primaryColumn"] article[data-testid="tweet"]`
    );

    for (let tweetIndex in tweetDivs) {
      const tweetText = await tweetDivs[tweetIndex].$(
        'div[data-testid="tweetText"] span'
      );
      const innerText = await page.evaluate(
        (tweetText) => tweetText.innerText,
        tweetText
      );

      const videoBlock = await tweetDivs[tweetIndex].$(
        'div[data-testid="videoPlayer"]'
      );

      if (videoBlock) {
        await sendMail(process.env.TO_EMAIL); // send mail to user
        console.log("Video available");
      } else {
        const imageBlock = await tweetDivs[tweetIndex].$(
          "div.css-175oi2r.r-9aw3ui.r-1s2bzr4 img"
        );

        if (imageBlock) {
          const tweetImg = await page.evaluate(
            (tweetImg) => tweetImg.currentSrc,
            imageBlock
          );

          await saveToDatabase({
            //save to db
            text: innerText,
            image: tweetImg,
          });
        } else {
          console.log("No image");
        }
      }
    }

    // Close the browser
    await browser.close();

    return tweetDivs;
  } catch (error) {
    console.log("Error occured:", error);
  }
}

const CRON_JOB_INTERVAL = "*/1 * * * *";

const runCronJob = async () => {
  try {
    console.log("Cron job started");
    await scrapeCoinDeskTweets();
  } catch (error) {
    console.error("Error occured while running the cron job", error);
  }
};

// Scheduling periodic scraping every 10 minutes
cron.schedule(CRON_JOB_INTERVAL, runCronJob);
