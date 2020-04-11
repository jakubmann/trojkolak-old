import React from 'react'
import Lobby from './Lobby'
import Words from './Words'
import Round from './Round'

import io from 'socket.io-client'

class App extends React.Component {
  constructor() {
    super()

    const socket = io('localhost:3636')

    this.state = {
      gamestate: '',
      usernameInput: '',
      username: '',
      socket: socket,
      players: [],
      currentTeam: 0,
      teams: [],
      points: []
    }

    socket.on('update-players', (players) => {
      this.setState({players: players})
    })
    
    socket.on('gamestate', (state) => {
      this.setState({gamestate: state})
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

  join = () => {
    this.state.socket.emit('join', this.state.usernameInput)
    this.setState({username: this.state.usernameInput})
    this.setState({usernameInput: ''})
  }

  changeName = (e) => {
    this.setState({usernameInput: e.target.value})
  }

  currentGameComponent = () => {
    if (this.state.gamestate === 'words') {
      return <Words players={this.state.players} socket={this.state.socket}/>
    } 
    else if (this.state.gamestate === 'description') {
      return <Round points={this.state.points} currentTeam={this.state.currentTeam} username={this.state.username} team={this.state.team} teams={this.state.teams} players={this.state.players} socket={this.state.socket}/>
    }
    else {
      return <Lobby socket={this.state.socket} join={this.join} changeName={this.changeName} username={this.state.usernameInput}/>
    }
  }
  render() {
    return (
      <this.currentGameComponent />
      //<Round points={this.state.points} currentTeam={this.state.currentTeam} username={this.state.username} team={this.state.team} teams={this.state.teams} players={this.state.players} socket={this.state.socket}/>
      //<Words players={this.state.players} socket={this.state.socket}/>

    )
  }
}

export default App