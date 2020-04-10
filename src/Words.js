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
    this.setState({ textInput: '' })
  }

  handleKey = (e) => {
    if (e.key === 'Enter') {
      this.addWord()
    }
  }

  render() {
    return (
      <div>
        <input disabled={!this.state.canAddWords} value={this.state.textInput} onKeyPress={this.handleKey} onChange={this.handleInput} />
        <button disabled={!this.state.canAddWords} onClick={this.addWord}>Přidat slovo</button>
        
        <p>Slova</p>
        <progress value={this.state.words} max={this.props.players.length * 3}></progress>
      </div>
    )
  }
}

export default Words;
