class MovieInfo {
    constructor(title, year, userRating, moviePage, runTime, genre,
                dirName, dirLink, actorList) {
        this.title = title
        this.year = year
        this.userRating = userRating
        this.moviePage = moviePage
        this.runTime = runTime
        this.genre = genre
        this.dirName = dirName
        this.dirLink = dirLink
        this.actorList = actorList
    }
}

module.exports = MovieInfo