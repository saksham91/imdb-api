const PORT = process.env.PORT || 8000
const express = require('express')
const axios = require('axios')
const cheerio = require('cheerio')
const puppeteer = require('puppeteer')
const fs = require('fs')

const MovieInfo = require('./model/movieinfo.js');
const Stars = require('./model/actors.js');
const { log } = require('console')

const preFixurl = "https://www.imdb.com/user/ur"
const postFixUrl = "/ratings?view=detailed"
const outputFile = 'data.json'

const basePrefixUrl = "https://www.imdb.com"

const app = express()
var movieList = []

// let requestHeaders = {
//     'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_2_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.192 Safari/537.36'
// }


const exportResults = (parsedResults) => {
    fs.writeFile(outputFile, JSON.stringify(parsedResults, null, 4), (err) => {
      if (err) {
        console.log(err)
      }
    })
  }

app.get('/', (req, res) => {
    res.json("Opening page..")
})

app.get('/allRatedMovies/:userId', async (req, res) => {
    const start = new Date();
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        // await page.setExtraHTTPHeaders({...requestHeaders});
    
        // Go to the target URL
        const userId = req.params.userId
        const url = preFixurl + userId + postFixUrl
        await page.goto(url, { waitUntil: 'networkidle2' });

        // Scroll to the end of the page
        let previousHeight;
        while (true) {
            let currentHeight = await page.evaluate('document.body.scrollHeight');
            if (previousHeight === currentHeight) break;
            await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
            await new Promise(resolve => setTimeout(resolve, 5000));
            previousHeight = currentHeight;
        }

        // Wait for dynamic ratings to load
        // await page.waitForSelector('.ratingGroup--user-rating');
        // await page.waitForFunction(() => {
        //     return document.querySelectorAll(".ratingGroup--user-rating > span.ipc-rating-star--rating").innerText !== '';
        // }, { timeout: 30000 });

        // Get the HTML content
        const content = await page.content();
        
        // Close the browser
        await browser.close();


        // Load the content into Cheerio
        const $ = cheerio.load(content);
        const loadingTime = new Date()
        console.log("Loading Time: " + (loadingTime - start)/1000)

        var numRatedStr = $('div[data-testid="list-page-mc-total-items"]').text()
        var numRatedInt = Number(numRatedStr)
        let pageLimit = Math.ceil(Number(numRatedInt)/100)
        $('.ipc-metadata-list-summary-item').each((index, element) => {
            const movieNameTag = $(element).find('.ipc-title--base');
            // homepage link for the movie title
            const anchorTag = movieNameTag.find('a');
            const movieLink = anchorTag.attr('href');
            const match = movieLink.match(/\/title\/([a-z0-9]+)\//i);

            // const moviePage = basePrefixUrl + movieLink

            var movieTitleId = ""
            if (match) {
                movieTitleId = match[1];
            }

            // movie name
            const movieTag = anchorTag.find('h3').text().split(".");
            const movieName = movieTag[1].trim()

            // year in which the movie was released
            let yearReleased, runTime, censorRated;
            const metaDataSpans = $('div.dli-title-metadata > span.dli-title-metadata-item');
            yearReleased = $(metaDataSpans[0]).text();
            runTime = $(metaDataSpans[1]).text();
            censorRated = $(metaDataSpans[2]).text();

            // movie rating by the user
            const ratingWidget = $(element).find('div.dli-ratings-container');
            const overallRating = ratingWidget.find('span.ipc-rating-star--rating').text();
            const numVotes = ratingWidget.find('span.ipc-rating-star--voteCount').text().trim().replace(/[\(\)]+/g,'');
            const userRating = ratingWidget.find('span.ipc-rating-star--currentUser > span').text();

            // $(element).find('.ipl-rating-interactive__state').each(function() {
            //     console.log("Checked: " + $(this).innerText)
            // })

            // var ratingValue = "1"
            // if (movieTitleId) { 
            //     const idToCheck = "#ipl-rating-selector-" + movieTitleId
            //     const dataValue = $(idToCheck).attr('data-value');
            //     if (dataValue) {
            //         ratingValue = dataValue;
            //       }
            // }

            // director info
            const dirStarsContainer = $(element).find('div.ictulU')
            const directorElement = dirStarsContainer.find('span.ePoirh').find('a').first();
            const directorName = directorElement.text();
            const directorLink = basePrefixUrl + directorElement.attr('href');

            // top stars info
            const stars = dirStarsContainer.find('a.dli-cast-item').map(function() {
                return {
                    name: $(this).text(),
                    link: basePrefixUrl + $(this).attr('href')
                };
            }).get();

            var movieData = new MovieInfo(movieName, yearReleased, overallRating, userRating, 
                movieTitleId, runTime, numVotes, directorName, directorLink, stars)
            movieList.push(movieData)
        });

        res.end(JSON.stringify({"rated":movieList}, null, 4))
        const now = new Date()
        console.log((now - start)/1000)
        console.log("Total Movies: " + movieList.length)
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('An error occurred');
    }
})

app.get('/ratedMovies', (req, res) => {
    const start = new Date();
    res.set('Content-Type', 'text/plain')
    let pageCounter = 0
    const getPageContent = async (url) => {
        await axios.get(url, config)
        .then((response) => {
            const $ = cheerio.load(response.data)
            var numRatedStr = $('div[data-testid="list-page-mc-total-items"]').text()
            var numRatedInt = Number(numRatedStr)
            let pageLimit = Math.ceil(Number(numRatedInt)/100)
            //console.log(numRatedInt)
            $('.ipc-metadata-list-summary-item').each((index, element) => {
                const movieInfoContainerDiv = $(element).find('div.sc-b189961a-0 hBZnfJ');
                const movieNameTag = $(element).find('.ipc-title--base');
                // homepage link for the movie title
                const anchorTag = movieNameTag.find('a');
                const movieLink = anchorTag.attr('href');
                const match = movieLink.match(/\/title\/([a-z0-9]+)\//i);

                // const moviePage = basePrefixUrl + movieLink

                var movieTitleId = ""
                if (match) {
                    movieTitleId = match[1];
                }

                // movie name
                const movieTag = anchorTag.find('h3').text().split(".");
                const movieName = movieTag[1].trim()

                // year in which the movie was released
                let yearReleased, runTime, censorRated;
                const metaDataSpans = $('div.dli-title-metadata > span.dli-title-metadata-item');
                yearReleased = $(metaDataSpans[0]).text();
                runTime = $(metaDataSpans[1]).text();
                censorRated = $(metaDataSpans[2]).text();

                // movie rating by the user
                const ratingWidget = $(element).find('div.dli-ratings-container');
                const overallRating = ratingWidget.find('span.ipc-rating-star--rating').text();
                const numVotes = ratingWidget.find('span.ipc-rating-star--voteCount').text().trim().replace(/[\(\)]+/g,'');
                const userRating = ratingWidget.find('span.ipc-rating-star--currentUser > span.ipc-rating-star--rating').text();

                // $(element).find('.ipl-rating-interactive__state').each(function() {
                //     console.log("Checked: " + $(this).innerText)
                // })

                // var ratingValue = "1"
                // if (movieTitleId) { 
                //     const idToCheck = "#ipl-rating-selector-" + movieTitleId
                //     const dataValue = $(idToCheck).attr('data-value');
                //     if (dataValue) {
                //         ratingValue = dataValue;
                //       }
                // }

                // movie run time and genre
                // const subInfo = $(element).find('p:first');
                // const runTime = subInfo.find('span.runtime').text()
                // const genre = subInfo.find('span.genre').text().trim()

                // director info
                const dirStarsContainer = $(element).find('div.ictulU')
                const directorElement = dirStarsContainer.find('span.ePoirh').find('a').first();
                const directorName = directorElement.text();
                const directorLink = basePrefixUrl + directorElement.attr('href');

                // top stars info
                const stars = dirStarsContainer.find('a.dli-cast-item').map(function() {
                    return {
                      name: $(this).text(),
                      link: basePrefixUrl + $(this).attr('href')
                    };
                  }).get();

                var movieData = new MovieInfo(movieName, yearReleased, overallRating, userRating, 
                    movieTitleId, runTime, numVotes, directorName, directorLink, stars)
                movieList.push(movieData)
            });

            res.end(JSON.stringify({"rated":movieList}, null, 4))
            const now = new Date()
            console.log((now - start)/1000)

            // let nextPageAnchorTag = $('div.list-pagination').find('a.lister-page-next')
            // let nextPageLink = nextPageAnchorTag.attr('href')
            // let nextPageUrl = basePrefixUrl + nextPageLink
            // pageCounter++

            // if (pageCounter < 1) {
            //     getPageContent(nextPageUrl)
            // } else {
            //     res.end(JSON.stringify({"rated":movieList}, null, 4))
            //     const now = new Date()
            //     console.log((now - start)/1000)
            //     //exportResults(movieList)
            // }
        })
        .catch((error) => {
            console.log(error)
        })
    }
    if (pageCounter == 0) getPageContent(endPointUrl)
})

app.get('/movieCast/:title', (req, res) => {
    res.set('Content-Type', 'text/plain')
    const title = req.params.title
    const baseMovieUrl = "https://www.imdb.com/title/"
    const fullMovieUrl = baseMovieUrl + title + "/fullcredits"
    axios.get(fullMovieUrl)
    .then((response) => {
        const $ = cheerio.load(response.data)
        const castList = $('table.cast_list');
        const actors = [];

        if (castList.length) {
            castList.find('tr.even, tr.odd').each((index, row) => {
                const actorName = $(row).find('td:not(.character)').find('a').text().trim();
                if (actorName) {
                    actors.push(actorName);
                }
            });
            res.end(JSON.stringify({"cast":actors}, null, 4));
        } else {
            console.log('Cast list not found.');
        }
    })
    .catch((error) => {
        if (error.response) {
            //console.log(error.response.data);
            res.end(`Error: ${error.response.status}`);
            //console.log(error.response.headers);
          } else if (error.request) {
            res.end(`Error: ${error.request}`);
          } else {
            res.end(`Error: ${error.message}`);
          }
    })
})

app.listen(PORT, () => console.log(`Server running on PORT ${PORT}`))


