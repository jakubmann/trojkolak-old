import React from 'react'

class Canvas extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            lineWidth: 10
        }



    }

    componentDidMount() {
        const socket = this.props.socket

        const canvas = this.refs.canvas
            
        const ctx = this.refs.canvas.getContext('2d')
        const boundings = this.refs.canvas.getBoundingClientRect();
        
    
        let mouseX = 0
        let mouseY = 0
        ctx.strokeStyle = 'black'
        ctx.lineWidth = this.state.lineWidth
        ctx.lineCap = 'round'
        let isDrawing = false

        this.refs.canvas.addEventListener('mousemove', (e) => {
            if (this.props.playing) {
                mouseX = e.clientX - boundings.left;
                mouseY = e.clientY - boundings.top;
                if (isDrawing) {
                    ctx.lineTo(mouseX, mouseY);
                    ctx.stroke();
                    socket.emit('canvas-mousedrag', {x: mouseX, y: mouseY})
                }
            }
        })

        this.refs.canvas.addEventListener('mousedown', (e) => {
            if (this.props.playing) {
                mouseX = e.clientX - boundings.left;
                mouseY = e.clientY - boundings.top;
                ctx.beginPath();
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(mouseX, mouseY);
                isDrawing = true;
                socket.emit('canvas-isdrawing', {x: mouseX, y: mouseY})
            }
            
        });

        window.addEventListener('mouseup', () => {
            if (this.props.playing) {
                isDrawing = false
            }
        })


        socket.on('canvas-isdrawing', (data) => {
            ctx.beginPath();
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(data.x, data.y);

        })

        socket.on('canvas-clear', () => {
            ctx.clearRect(0, 0, canvas.width,canvas.height);
        })

        socket.on('canvas-mousedrag', (data) => {
            ctx.lineTo(data.x, data.y);
            ctx.stroke();
        })

        socket.on('canvas-changedata', (data) => {
            ctx.lineWidth = data.lineWidth
            ctx.strokeStyle = data.strokeStyle

            if (data.clear) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        })

        socket.on('round-end', () => {
            if (this.props.playing) {
                ctx.strokeStyle = 'black'
                ctx.lineWidth = 10

                this.setState({
                    lineWidth: 10
                })

            }
        })

        
    }

    
    setLineWidth = (e) => {
        this.setState({
            lineWidth: e.target.value
        })
       this.refs.canvas.getContext('2d').lineWidth = this.state.lineWidth
       this.changeData(false)
    }

    clear = () => {
        this.refs.canvas.getContext('2d').clearRect(0, 0, this.refs.canvas.width, this.refs.canvas.height);
        this.changeData(true)
    }

    changeColor = (color) => {
        this.refs.canvas.getContext('2d').strokeStyle = color
        this.changeData(false)
    }

    changeData = (clear) => {
        let ctx = this.refs.canvas.getContext('2d')
        this.props.socket.emit('canvas-changedata', {
            lineWidth: ctx.lineWidth,
            strokeStyle: ctx.strokeStyle,
            clear: clear
        })
    }

    render() {
        return (
            <div>
                { this.props.playing ?
                    <div className="canvas__tools">
                        <div className="canvas__colors">
                            <button className="color color__black" onClick={() => this.changeColor('black')}></button>
                            <button className="color color__red" onClick={() => this.changeColor('red')}></button>
                            <button className="color color__green" onClick={() => this.changeColor('green')}></button>
                            <button className="color color__blue" onClick={() => this.changeColor('blue')}></button>
                            <button className="color color__yellow" onClick={() => this.changeColor('yellow')}></button>
                            <button className="color color__eraser" onClick={() => this.changeColor('white')}>Guma</button>
                        </div>
                        <button className="canvas__clear" onClick={this.clear}>Vymazat</button>
                        <div className="brush"><div className="brush__label">Štětec: </div><input className="brush__slider" type="range" min={0} max={100} value={this.state.lineWidth} onChange={this.setLineWidth} /></div>
                    </div>
                    :
                    ''
                }
                <canvas className={this.props.playing ? 'canvas canvas--playing' : 'canvas'} ref="canvas" width={800} height={500}></canvas>    

            </div>
        )
    }
}

export default Canvas