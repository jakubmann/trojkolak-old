import React from 'react'
import Canvas from './Canvas'

class Round extends React.Component {
    constructor(props) {
        super(props)
        this.state ={
            guessing: false,
            playing: false,
            startRound: false,
            roundEnd: false,
            word: {},
            time: null,
            splash: false
        }

        const socket = this.props.socket

        socket.on('playing', (word) => {
            this.setState({
                playing: true,
                word: word
            })
        })

        socket.on('start-round', () => {
            this.setState({
                startRound: true
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
                time: time,
                roundEnd: time === 0
            })
        })
    }

    guessed = () => {
        this.props.socket.emit('guessed')
    }

    startNextRound  = () => {
        this.props.socket.emit('next-round')
        this.setState({
            startRound: false
        })
    }

    render() {
        return (
            <div className="round" style={{display: this.props.hidden ? 'none' : 'block'}}>
                <h1 className="round__heading">{this.props.round}. Kolo</h1>
                <div className="round__username">{this.props.username}</div>
                

                <div>
                    
                    { this.state.startRound ? <button className="round__next" onClick={this.startNextRound}>Začít kolo</button> : ''}
                    { this.props.round === 3 && this.state.time > 0 ? <Canvas playing={this.state.playing} socket={this.props.socket} /> : ''}
                    { this.state.guessing ? <div className={this.props.round === 3 ? 'round__word round__word--draw' : 'round__word'}>Hádáš slovo</div> : ''}
                    { this.state.playing ?  <div className={this.props.round === 3 ? 'round__word round__word--draw' : 'round__word'}>{this.state.word.word}</div> : '' }
                    { this.state.playing ? <button className={this.props.round === 3 ? 'round__guessed round__guessed--draw' : 'round__guessed'} onClick={this.guessed}>Uhodnuto</button> : ''}
                </div>

                { !this.state.startRound ?
                    <div>
                    { this.state.roundEnd ?
                        <div className="round__word">Konec kola</div>
                        :
                        <div className={ this.state.time > 10 ? 'round__time' : 'round__time round__time--critical'}>
                            { this.state.time }
                        </div>
                    }
                    </div>
                    :
                    ''
                }
                

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