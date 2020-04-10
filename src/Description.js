import React from 'react'

class Description extends React.Component {
    constructor(props) {
        super(props)
        this.state ={
            guessing: false,
            playing: false,
            word: '',
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

    render() {
        return (
            <div>
                <div>{this.props.username}</div>
                <div>
                    Týmy
                    <div>
                        {this.props.teams.map((team, i) => 
                            <ul>
                                Tým {i + 1}
                                
                                {team.map(player => 
                                    <li>{player.username}</li>
                                )} 
                            </ul>    
                        )}
                    </div>
                </div>
                <div>
                    <div>{ this.state.playing ? 'Popisuješ slovo: ' + this.state.word.word : ''}</div>
                    <div>{ this.state.guessing ? 'Hádáš slovo' : ''}</div>
                </div>
                <div>
                    Zbývající čas: { this.state.time }
                </div>
            </div>
        )
    }
}

export default Description