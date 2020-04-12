const express = require('express')

const app = express()

const server = require('http').Server(app);
const io = require('socket.io')(server);
const path = require('path')



app.use('/', express.static(path.join(__dirname, 'client/build/')));

server.listen(5000);



let players = []
let words = []
let teams = []

let guessed = false
let gameStarted = false
let nextRound = false

let currentPlayer = 0
let currentTeam = 0

let round = 1
let timeLeft = 0

let gamestate = 'lobby'


let playingRound = false

let word = ''

nextPlayer = () => {
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
}

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
wordRound = (wordsActive, lastWord) => {
    let noneGuessed = true
    let team = teams[currentTeam]
    io.emit('current-team', currentTeam)
    let time = 60
    if (timeLeft !== 0) {
        time = timeLeft
        timeLeft = 0
    }
    word = lastWord
    if (!lastWord) {
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
    
    let timer = setInterval(() => {
        io.emit('time', time)
        time--
        if (time < 1) {
            
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
                
                nextPlayer()

                io.emit('time', time)
                console.log('start next round')
                io.emit('current-team', currentTeam)
                io.to(teams[currentTeam][currentPlayer].id).emit('start-round')
                
                io.emit('round-end')
                
                playingRound = false
                let nextRoundTimer = setInterval(() => {
                    if (nextRound) {
                        playingRound = true
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
            io.emit('canvas-clear')
            teams[currentTeam][currentPlayer].points++
            io.emit('update-points', getPoints())

            noneGuessed = false
            if (wordsActive.length > 0) {
                word = wordsActive.pop()
                io.to(teams[currentTeam][currentPlayer].id).emit('playing', word)
                
                
                guessed = false
            }
            //Kdyz dojdou slova ukoncit kolo
            else {
                io.emit('round-end')
                io.emit('biground-end')
                timeLeft = time
                round++
                startGame()
                clearInterval(guessing)
                clearInterval(timer)
                return true
            }

        }
    }, 10)
}



function shuffle(a) {
    let b = a;
    for (let i = b.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [b[i], b[j]] = [b[j], b[i]];
    }
    return b;
}

startGame = () => {
    if (round === 1) {
        gamestate = 'description'
        console.log('DESC ROUND STARTED')
    } else if (round === 2) {
        gamestate = 'oneword'
        console.log('ONEWORD ROUND STARTED')
    } else if (round === 3) {
        gamestate = 'draw'
        console.log('DRAW ROUND STARTED')
    } 
    io.emit('gamestate', gamestate)
    if (round === 4) {
        io.emit('allwords', words)
        gamestate = 'leaderboard'
        io.emit('gamestate', gamestate)
        console.log('END GAME')
    }
    else {
        let wordsActive = shuffle(words.concat())
        
        console.log(wordsActive === words)

        io.to(teams[currentTeam][currentPlayer].id).emit('start-round')
        io.emit('update-points', getPoints())

        let nextRoundTimer = setInterval(() => {
            if (nextRound) {
                playingRound = true
                wordRound(wordsActive, false)
                nextRound = false
                clearInterval(nextRoundTimer)
            }
        }, 10)
    }
}

io.on('connection', (socket) => {

    /*
    if (players.filter(p => p.id == socket.id).length === 0 && gameStarted) {
            io.to(socket.id).emit('cant-play')
    } else {
        io.to(socket.id).emit('gamestate', gamestate)
        io.to(socket.id).emit('update-players', players)
        io.to(socket.id).emit('update-teams', teams)
    }
    */

    io.emit('update-players', players)

    //Pridani slova do seznamu slov
    socket.on('word', (word) => {
        let username = players.filter(p => p.id == socket.id)[0].username
        words.push({player: socket.id, username: username, word: word})
        if (words.filter(w => w.player == socket.id).length == 5) {
            io.to(socket.id).emit('max-words')
        }
        io.emit('update-words', words.length)

        if (words.length == players.length * 5) {
            startGame()
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
                    io.emit('gamestarted')
                    setTimeout(() => {
                        gamestate = 'words'
                        io.emit('gamestate', gamestate)
                    
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

    socket.on('canvas-isdrawing', (data) => {
        socket.broadcast.emit('canvas-isdrawing', data)
    })

    socket.on('canvas-changedata', (data) => {
        socket.broadcast.emit('canvas-changedata', data)
    })

    socket.on('canvas-mousedrag', (data) => {
        socket.broadcast.emit('canvas-mousedrag', data)
    })


    socket.on('reconnected', (username) => {
        players.map(p => {
            if (p.username === username) {
                p.id = socket.id
            }
        })

        io.to(socket.id).emit('gamestate', gamestate)
        io.to(socket.id).emit('update-players', players)
        io.to(socket.id).emit('update-teams', teams)
        io.to(socket.id).emit('update-points', getPoints())
        io.to(socket.id).emit('update-words', words.length)

        if (!playingRound && gameStarted) {
            if (socket.id === teams[currentTeam][currentPlayer].id) {
                io.to(socket.id).emit('start-round')
            }
        }

        if (playingRound) {
            if (socket.id === teams[currentTeam][currentPlayer].id) {
                io.to(socket.id).emit('playing', word)
            } else {
                teams[currentTeam].map(p => {
                    if (p.id === socket.id && socket.id !== teams[currentTeam][currentPlayer].id) {
                        io.to(socket.id).emit('guessing')
                    }
                })
            }
        }
    })

    socket.on('leave', () => {
        io.to(socket.id).emit('gamestate', 'lobby')
        players = players.filter(p => p.id != socket.id)
        io.emit('update-players', players)

        if (players.length === 0) {
            players = []
            words = []
            teams = []


            gameStarted = false


            currentPlayer = 0
            currentTeam = 0

            round = 1
            timeLeft = 0

            playingRound = false
            word = ''
            
        }

    })
}) 

