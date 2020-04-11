import React from 'react'

class Round extends React.Component {
    constructor(props) {
        super(props)
        this.state ={
            guessing: false,
            playing: false,
            word: {},
            time: 60
        }

        const socket = this.props.socket

        socket.on('playing', (word) => {
            this.setState({
                playing: true,
                word: word
            })
        })

        socket.on('guessing', () => {
            this.setState({
                guessing : true
            })
        })

        socket.on('round-end', () => {
            this.setState({
                playing: false,
                guessing: false,
                word: ''
            })
        })

        socket.on('time', (time) => {
            this.setState({
                time: time
            })
        })
    }


    guessed = () => {
        this.props.socket.emit('guessed')
    }

    render() {
        return (
            <div className="round">
                <h1 className="round__heading">1. Kolo</h1>
                <div className="round__username">{this.props.username}</div>
                

                <div>
                    <div className="round__word">{ this.state.playing ? '' + this.state.word.word : ''}</div>
                    {this.state.playing ? <button className="round__guessed" onClick={this.guessed}>Uhodnuto</button> : ''}
                    <div className="round__word">{ this.state.guessing ? 'Hádáš slovo' : ''}</div>
                </div>
                <div className={ this.state.time > 10 ? 'round__time' : 'round__time round__time--critical'}>
                    { this.state.time }
                </div>

                <div className="teams">
                    
                        {this.props.teams.map((team, i) => 
                        <div className={ i === this.props.currentTeam ? 'team team--playing' : 'team'}>
                            <ul className="team__players">
                                <h3 className="team__heading">Tým {i + 1}</h3>
                                {team.map(player => 
                                    <li className="team__player">{player.username}</li>
                                )}
                            </ul>
                            <div className="team__points">Body: { this.props.points[i]}</div>
                        </div>
                        )}
                </div>
            </div>
        )
    }
}

export default Round