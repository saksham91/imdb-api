const PORT = 8000
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
                const moviePage = basePrefixUrl + movieLink

                // movie name
                const movieName = anchorTag.text();

                // year in which the movie was released
                const yearTag = headerTag.find('span.lister-item-year');
                const year = yearTag.text().trim();

                // movie rating by the user
                const ratingWidget = $(element).find('.ipl-rating-widget');
                const ratingValue = ratingWidget.find('span.ipl-rating-star__rating').text().trim()

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

                var movieData = new MovieInfo(movieName, year, ratingValue, moviePage, runTime, genre,
                                            directorName, directorLink, stars)
                movieList.push(movieData)
            });
            let nextPageAnchorTag = $('div.list-pagination').find('a.lister-page-next')
            let nextPageLink = nextPageAnchorTag.attr('href')
            let nextPageUrl = basePrefixUrl + nextPageLink
            pageCounter++

            if (pageCounter < pageLimit) {
                getPageContent(nextPageUrl)
            } else {
                res.end(JSON.stringify(movieList, null, 4))
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

app.listen(PORT, () => console.log(`Server running on PORT ${PORT}`))


