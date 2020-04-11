import React from 'react';


class Words extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      textInput: '',
      canAddWords: true,
      words: 0
    }
    
    this.props.socket.on('update-words', newWords => {
        console.log(newWords)
        this.setState({words: newWords})
    })

    this.props.socket.on('max-words', () => {
        this.setState({canAddWords: false})
    })

  }

  handleInput = (e) => {
    this.setState({ textInput: e.target.value })
  }
  

  addWord = () => {
    this.props.socket.emit('word', this.state.textInput)
    //this.setState({ textInput: '' })
  }

  handleKey = (e) => {
    if (e.key === 'Enter') {
      this.addWord()
    }
  }

  componentDidMount = () => {
    for (let i = 0; i < 3; i++) {
      window.setTimeout(() => {
        this.setState({textInput: Math.floor(Math.random() * 1000).toString()})
        this.addWord()
      }, i * 800)
    }
  }



  render() {
    return (
      <div className="words">
        <input className="words__input" disabled={!this.state.canAddWords} value={this.state.textInput} onKeyPress={this.handleKey} onChange={this.handleInput} />
        <button className="words__add" disabled={!this.state.canAddWords} onClick={this.addWord}>Přidat</button>

        <div className="progress">
          <div className="progress__bar">
            <div className="progress__filler" style={{width: `${(this.state.words / (this.props.players.length * 3)) * 100}%`}}></div>
          </div>
        </div>
      </div>
    )
  }
}

export default Words;
