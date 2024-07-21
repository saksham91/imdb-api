class MovieInfo {
    constructor(title, year, overallRating, userRating, moviePage, runTime, numVotes,
                dirName, dirLink, actorList) {
        this.title = title
        this.year = year
        this.overallRating = overallRating
        this.userRating = userRating
        this.moviePage = moviePage
        this.runTime = runTime
        this.numVotes = numVotes
        this.dirName = dirName
        this.dirLink = dirLink
        this.actorList = actorList
    }
}

module.exports = MovieInfo