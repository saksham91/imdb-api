const PORT = process.env.PORT || 8000
const express = require('express')
const axios = require('axios')
const cheerio = require('cheerio')
const fs = require('fs')

const MovieInfo = require('./model/movieinfo.js');
const Stars = require('./model/actors.js');

const preFixurl = "https://www.imdb.com/user/ur"
const userId = "25717993"
const postFixUrl = "/ratings?ref_=nv_usr_rt_4"
const endPointUrl = preFixurl + userId + postFixUrl
const outputFile = 'data.json'

const basePrefixUrl = "https://www.imdb.com"

const app = express()
var movieList = []

const exportResults = (parsedResults) => {
    fs.writeFile(outputFile, JSON.stringify(parsedResults, null, 4), (err) => {
      if (err) {
        console.log(err)
      }
    })
  }

app.get('/', (req, res) => {
    res.json("Hi there..")
})

app.get('/allRatedMovies', (req, res) => {
    const start = new Date();
    let pageCounter = 0
    const getPageContent = async (url) => {
        await axios.get(url)
        .then((response) => {
            const $ = cheerio.load(response.data)
            var numRatedStr = $('div.lister-list-length > span').text()
            var numRatedInt = Number(numRatedStr.replace(",", ""))
            let pageLimit = Math.ceil(Number(numRatedInt)/100)
            //console.log(numRatedInt)
            $('.lister-item-content').each((index, element) => {
                const headerTag = $(element).find('.lister-item-header');
                // homepage link for the movie title
                const anchorTag = headerTag.find('a');
                const movieLink = anchorTag.attr('href');
                const match = movieLink.match(/\/title\/([a-z0-9]+)\//i);

                //const moviePage = basePrefixUrl + movieLink

                var movieTitleId = ""
                if (match) {
                    movieTitleId = match[1];
                }

                // movie name
                const movieName = anchorTag.text();

                // year in which the movie was released
                const yearTag = headerTag.find('span.lister-item-year');
                const year = yearTag.text().trim();

                // movie rating by the user
                const ratingWidget = $(element).find('div.ipl-rating-widget');
                const ratingValue = ratingWidget.find('span.ipl-rating-star__rating').prop('innerHTML')

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
                const subInfo = $(element).find('p:first');
                const runTime = subInfo.find('span.runtime').text()
                const genre = subInfo.find('span.genre').text().trim()

                // director info
                const directorElement = $(element).find('p:nth-child(7)').find('a').first();
                const directorName = directorElement.text();
                const directorLink = basePrefixUrl + directorElement.attr('href');

                // top stars info
                var stars = []
                $(element).find('p:nth-child(7)').find('a:not(:first-child)').each((index, element) => {
                    const starName = $(element).text();
                    const starLink = $(element).attr('href');
                    stars.push(new Stars(starName, basePrefixUrl + starLink))
                });

                var movieData = new MovieInfo(movieName, year, ratingValue, movieTitleId, runTime, genre,
                                            directorName, directorLink, stars)
                movieList.push(movieData)
            });
            let nextPageAnchorTag = $('div.list-pagination').find('a.lister-page-next')
            let nextPageLink = nextPageAnchorTag.attr('href')
            let nextPageUrl = basePrefixUrl + nextPageLink
            pageCounter++

            if (pageCounter < 1) {
                getPageContent(nextPageUrl)
            } else {
                res.end(JSON.stringify({"rated":movieList}, null, 4))
                const now = new Date()
                console.log((now - start)/1000)
                //exportResults(movieList)
            }
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


