import React from 'react'
import Lobby from './Lobby'
import Words from './Words'
import Round from './Round'
import Leaderboard from './Leaderboard'


import io from 'socket.io-client'

class App extends React.Component {
  constructor() {
    super()
    let port = process.env.PORT || 5000

    const socket = io('http://localhost:' + port)


    this.state = {
      gamestate: '',
      usernameInput: '',
      //usernameInput: Math.floor(Math.random() * 1000).toString(),
      username: '',
      socket: socket,
      players: [],
      currentTeam: 0,
      teams: [],
      points: [],
      splash: false,
      round: 1,
      words: []
    }

    socket.on('allwords', (words) => {
      this.setState({words: words})
    })

    socket.on('update-players', (players) => {
      this.setState({players: players})
    })
    
    socket.on('gamestate', (state) => {
      console.log(state)
      this.setState({gamestate: state})
      if (state === 'description') {
        this.setState({round: 1})
        this.showSplash()
      }
      else if (state === 'oneword') {
        this.setState({round: 2})
        this.showSplash()
      }
      else if (state === 'draw') {
        this.setState({round: 3})
        this.showSplash()
      }
    })

    socket.on('current-team', (team) => {
      this.setState({currentTeam: team})
    })

    socket.on('update-teams', (teams) => {
      this.setState({teams: teams})
    })

    socket.on('update-points', (points) => {
      this.setState({points: points})
    })

  }

  showSplash = () => {
    this.setState({
      splash: true
    })
    window.setTimeout(() => {
      this.setState({
        splash: false
      })
    }, 2000)
  }

  join = () => {
    localStorage.setItem('username', this.state.usernameInput)
    this.state.socket.emit('join', this.state.usernameInput)
    this.setState({username: this.state.usernameInput})
    this.setState({usernameInput: ''})
  }

  changeName = (e) => {
    this.setState({usernameInput: e.target.value})
  }

  leave = () => {
    this.state.socket.emit('leave')
    localStorage.clear()
  }

  

  currentGameComponent = () => {
    if (this.state.gamestate === 'words') {
      return <Words players={this.state.players} socket={this.state.socket}/>
    } 
    else if (this.state.gamestate === 'description' || this.state.gamestate === 'oneword' || this.state.gamestate === 'draw') {
      return <Round hidden={this.state.splash} round={this.state.round} points={this.state.points} currentTeam={this.state.currentTeam} username={this.state.username} team={this.state.team} teams={this.state.teams} players={this.state.players} socket={this.state.socket}/>
    }
    else if (this.state.gamestate === 'leaderboard') {
      return <Leaderboard leave={this.leave} words={this.state.words} points={this.state.points} teams={this.state.teams} />
    }
    else {
      return <Lobby leave={this.leave} socket={this.state.socket} join={this.join} changeName={this.changeName} username={this.state.usernameInput}/>
    }
  }

  componentDidMount() {
    let username = localStorage.getItem('username')
    if (username) {
      alert(localStorage.getItem('username'))
      this.state.socket.emit('reconnected', username)
      this.setState({
        username: username
      })
    }
  }

  render() {
    return (

      <div>
        {this.state.splash ?
        <div className="splash"><h1 className="splash__text">{this.state.round}. Kolo</h1></div>
        :
        ''
        }
        <this.currentGameComponent />
      </div>

      //<Round round={this.state.round} points={this.state.points} currentTeam={this.state.currentTeam} username={this.state.username} team={this.state.team} teams={this.state.teams} players={this.state.players} socket={this.state.socket}/>


    )
  }
}

export default App