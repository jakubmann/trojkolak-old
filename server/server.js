let app = require('http').createServer()
let io = require('socket.io')(app)



app.listen(3636, () => {
    console.log('Server listenning on port 3636')
})

function addPoints(player, points) {
    players[player].points = points
}

function getPoints() {
    let points = []
    players.map((player) => {
        points.push(player.points)
    })

    return points
}

//Velky kolo (popis, jednoslovne)
function bigRound(currentTeam, currentPlayer) {
    let wordsActive = shuffle(words)
    let end = false
    let team = teams[currentTeam]
    io.emit('current-team', currentTeam)

    //Hracovi co slovo vysvetluje poslat slovo, ostatnim v tymu hadaji slovo
    team.map((player, i) => {
        if (i === currentPlayer) {
            let word = wordsActive.pop()
            io.to(player.id).emit('playing', word)
        } else {
            io.to(player.id).emit('guessing')
        }
    })

    //minuta na hadani slov
    let time = 60
    let timer = setInterval(() => {
        io.emit('time', time)
        time--
        if (time < 1 || wordsActive.length === 0) {
            io.emit('time', time)
            io.emit('round-end')
            io.emit('update-points', getPoints())
            end = true
            clearInterval(timer)
        }
    }, 1000)

    //Pri uhadnuti pridat body
    io.on('guessed', () => {
        addPoints(currentPlayer, 1)
    })

    //Kdyz dojdou slova ukoncit kolo
    if (wordsActive.length === 0) {
        io.emit('biground-end')
        console.log('biground end')
    }
    //Jinak zavolat bigRound s dalsim tymem
    else if (end) {
        if (currentPlayer == currentTeam.length-1) {
            if (currentTeam == teams.length -1) {
                currentTeam = 0
            } else {
                currentPlayer = 0
                currentTeam++
            }
        } else {
            currentPlayer++
        }

        io.on('startgame', () => {
            console.log('start next round')
            //bigRound(currentTeam, currentPlayer, socket)
        })
    }
}


let players = []
let words = []
let teams = []
let points = []

let gameStarted = false

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
            bigRound(0, 0)
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
                                points.push(0)
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
                    }, 100000)
                }   
            }
        }
    })

    socket.on('disconnect', () => {
        players = players.filter(p => p.id != socket.id)
        io.emit('update-players', players)
    })

}) 