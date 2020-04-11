let app = require('http').createServer()
let io = require('socket.io')(app)



app.listen(3636, () => {
    console.log('Server listenning on port 3636')
})

function getPoints() {
    let points = []
    teams.map(team => {
        let teamPoints = 0
        team.map(player => {
            teamPoints += player.points
        })
        points.push(teamPoints)
    })

    return points
}

//Velky kolo (popis, jednoslovne)
function wordRound(words, lastWord, round = false) {
    let wordsActive = words
    let noneGuessed = true
    let team = teams[currentTeam]
    io.emit('current-team', currentTeam)

    let word = lastWord
    if (lastWord === false) {
        word = wordsActive.pop()
    } 

    //Hracovi co slovo vysvetluje poslat slovo, ostatnim v tymu hadaji slovo
    team.map((player, i) => {
        if (i === currentPlayer) {
            io.to(player.id).emit('playing', word)
        } else {
            io.to(player.id).emit('guessing')
        }
    })

    //minuta na hadani slov
    let time = 10
    let timer = setInterval(() => {
        console.log(time)
        io.emit('time', time)
        time--
        if (time < 1) {
            console.log(time)
            
            clearInterval(timer)
            clearInterval(guessing)



            //wordRound s dalsim tymem


            setTimeout(() => {
                let lastWord = word
                if (noneGuessed) {
                    teams[currentTeam][currentPlayer].points++
                    io.emit('update-points', getPoints())
                    lastWord = false
                }
                
                if (currentTeam === teams.length - 1) {
                    if (currentPlayer === teams[currentTeam].length - 1) {
                        currentPlayer = 0
                    }
                    else {
                        currentPlayer++
                    }
                    currentTeam = 0
                }
                else {
                    currentTeam++
                }

                io.emit('time', time)
                console.log('start next round')
                io.emit('current-team', currentTeam)
                io.to(teams[currentTeam][currentPlayer].id).emit('start-round')
                
                io.emit('round-end')
                

                let nextRoundTimer = setInterval(() => {
                    if (nextRound) {
                        wordRound(wordsActive, lastWord)
                        nextRound = false
                        clearInterval(nextRoundTimer)
                    }
                }, 10)

            }, 1000)
                
        }
    }, 1000)

    let guessing = setInterval(() => {
        //Pri uhadnuti pridat body
        if (guessed) {
            teams[currentTeam][currentPlayer].points++
            io.emit('update-points', getPoints())

            noneGuessed = false
            if (wordsActive.length > 0) {
                word = wordsActive.pop()
                io.to(teams[currentTeam][currentPlayer].id).emit('playing', word)
                console.log('guessed!')
                
                
                guessed = false
            }
            //Kdyz dojdou slova ukoncit kolo
            else {
                io.emit('biground-end')
                io.emit('gamestate', 'oneword')
                console.log('END OF FIRST ROUND')
                clearInterval(guessing)
                clearInterval(timer)
            }

        }
    }, 10)
}


let players = []
let words = []
let teams = []

let guessed = false
let gameStarted = false
let nextRound = false

let currentPlayer = 0
let currentTeam = 0



function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

io.on('connection', (socket) => {

    if (players.filter(p => p.id == socket.id).length === 0 && gameStarted) {
        io.to(socket.id).emit('cant-play')
    } else {
        io.emit('update-players', players)
        io.emit('update-teams', teams)
    }

    io.emit('update-players', players)

    //Pridani slova do seznamu slov
    socket.on('word', (word) => {
        let username = players.filter(p => p.id == socket.id)[0].username
        words.push({player: socket.id, username: username, word: word, used: false})
        if (words.filter(w => w.player == socket.id).length == 3) {
            io.to(socket.id).emit('max-words')
        }
        io.emit('update-words', words.length)

        if (words.length == players.length * 3) {
            io.emit('gamestate', 'description')
            let wordsActive = shuffle(words)
            io.to(teams[0][0].id).emit('start-round')
            io.emit('update-points', getPoints())

            let nextRoundTimer = setInterval(() => {
                if (nextRound) {
                    wordRound(wordsActive, false)
                    nextRound = false
                    clearInterval(nextRoundTimer)
                }
            }, 10)
        }
    })

    socket.on('join', (username) => {
        
        if (players.filter(p => p.id == socket.id).length === 0) {
            players.push({id: socket.id, username: username, ready: false, points: 0})
            io.emit('update-players', players)
        }
        
    })

    socket.on('ready', (ready) => {
        if(players.filter(p => p.id == socket.id).length !== 0) {
            players.filter(p => p.id == socket.id)[0].ready = ready
        }
        io.emit('update-players', players)

        //Kdyz jsou vsichni hraci pripraveni
        if(players.filter(p => p.ready).length == players.length) {
            //Podle poctu  hracu urcit velikost tymu    
            if (players.length % 2 != 0) {
                if (players.length % 3 != 0) {
                    io.emit('error', 'Hráče nejde rozdělit do týmů!')
                } else {
                    teamsize = 3
                    if (players.length / teamsize === 1) {
                        io.emit('error', 'Ke hře je potřeba více hráčů!')
                    }
                } 
            }
            else {
                teamsize = 2

                //Error pokud je jenom jeden tym
                if (players.length / teamsize === 1) {
                    io.emit('error', 'Ke hře je potřeba více hráčů!')
                }
                else {
                    //Rozdelit hrace do tymu
                    shuffle(players)
                    let team = []
                        players.map((player, i) => {
                            team.push(player)
                            if (team.length == teamsize) {
                                teams.push(team)
                                team = []
                            }
                        })

                    io.emit('update-teams', teams)

                    gameStarted = true
                    setTimeout(() => {
                        io.emit('gamestate', 'words')
                    
                        players.map(player => {
                            let playerTeam = []
                            teams.map(team => {
                                team.map(player => {
                                    if (player.id === socket.id) {
                                        playerTeam = team
                                    }
                                })
                            })
                            //io.to(player.id).emit('team', playerTeam)
                        })
                    }, 5000)
                }   
            }
        }
    })

    socket.on('guessed', () => {
        guessed = true
    })

    socket.on('next-round', () => {
        nextRound = true
    })

    socket.on('disconnect', () => {
        players = players.filter(p => p.id != socket.id)
        io.emit('update-players', players)
    })

}) 

