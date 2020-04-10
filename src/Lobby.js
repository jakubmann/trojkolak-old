import React from 'react'

class Lobby extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            players: [],
            teams: [],
            canJoin: true,
            canReady: false,
            ready: false,
            error: ''
        }

        this.props.socket.on('update-players', (players) => {
            console.log(players)
            this.setState({
                players: players,
                error: ''
            })
        })

        this.props.socket.on('gamestatus', (status) => {
            if (status === 'started') {
                this.setState({canJoin: false})
                this.setState({canReady: false})
            }
        })

        this.props.socket.on('update-teams', (teams) => {
            this.setState({teams: teams})
        })
        
        this.props.socket.on('cant-play', () => {
            this.setState({
                canJoin: false,
                canReady: false
              })
          })

        this.props.socket.on('error', (message) => {
            this.setState({error: message})
        })
    }

    join = () => {
        if (this.props.username.length > 1) {
            this.setState({canJoin: false, canReady: true})
            this.props.join()
        }
    }

    handleKey = (e) => {
        if (e.key === 'Enter') {
          this.join()
        }
      }

    ready = () => {
        this.setState({ready: this.state.ready ? false : true})
        window.setTimeout(() => {
            this.props.socket.emit('ready', this.state.ready)
        }, 100)
    }

    render() {
        return (
            <div className="lobby">
                <input placeholder="Přezdívka" className="lobby__username" disabled={!this.state.canJoin} type="text" value={this.props.username} onKeyPress={this.handleKey} onChange={this.props.changeName}></input>
                <button className="lobby__join" disabled={!this.state.canJoin} onClick={this.join}>Připojit se</button>
                <button className={this.state.ready ? 'lobby__ready--ready lobby__ready' : 'lobby__ready' } disabled={!this.state.canReady} onClick={this.ready}>Začít</button>
                <div>{(!this.state.canReady && !this.state.canJoin) ? 'Hra už běží!' : this.state.error}</div>

                <div className="players">
                    <h2 className="players__heading">{this.state.players.length > 0 ? 'Hráči' : ''}</h2>
                    <ul className="players__list">
                        {this.state.players.map(p => <li className="players__player">{p.username + ' '} {p.ready ? '✓' : ''}</li>)}
                    </ul> 
                </div>

                <div className="teams">
                    <h2 className="teams__heading">{this.state.teams.length > 0 ? 'Týmy:' : ''}</h2>
                        {this.state.teams.map((team, i) => 
                        <div className="team">
                            <ul className="team__players">
                                <h3 className="team__heading">Tým {i + 1}</h3>
                                {team.map(player => 
                                    <li className="team__player">{player.username}</li>
                                )}
                            </ul>
                        </div>
                        )}
                </div>
            </div>
        )
    }
}

export default Lobby