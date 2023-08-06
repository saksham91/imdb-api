const PORT = 8000
const express = require('express')
const axios = require('axios')
const cheerio = require('cheerio')

const MovieInfo = require('./movieinfo.js');
const Stars = require('./actors.js');

const preFixurl = "https://www.imdb.com/user/ur"
const userId = "25717993"
const postFixUrl = "/ratings?ref_=nv_usr_rt_4"
const endPointUrl = preFixurl + userId + postFixUrl

const basePrefixUrl = "https://www.imdb.com"

const app = express()
var movieList = []

app.get('/', (req, res) => {
    res.json("Hi there..")
})

app.get('/allRatedMovies', (req, res) => {
    const start = Date.now();
    axios.get(endPointUrl)
    .then((response) => {
        const $ = cheerio.load(response.data)
        var numRated = $('div.lister-list-length > span').text()
        res.json(numRated)
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
        console.log(movieList.length)
    })
})

app.listen(PORT, () => console.log(`Server running on PORT ${PORT}`))


