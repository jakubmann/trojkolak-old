import React from 'react'

class Leaderboard extends React.Component {
    constructor(props) {
        super(props)


    }

    

    render() {
        return (
            <div className="leaderboard">
                {this.props.teams.map((team, i) => 
                    <div className="leaderboard__team">
                        <ul className="leaderboard__players">
                            <h3 className="leaderboard__heading">Tým {i + 1}</h3>
                            {team.map(player => 
                                <li className="leaderboard__player">{player.username}</li>
                            )}
                        </ul>
                        <div className="leaderboard__points">Body: { this.props.points[i]}</div>
                    </div>
                )}

                <h2 className="leaderboard__words">SLOVA</h2>
                {this.props.words.map(word => 
                    <p className="leaderboard__word">{word.word}</p>
                )}
            </div>
        )
    }
}

export default Leaderboard