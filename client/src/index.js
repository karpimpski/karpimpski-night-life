import React, { Component } from 'react';
import Client from './Client';
import ReactDOM from 'react-dom';
import './index.scss';

class Index extends Component {
  constructor(props){
    super(props);
    this.state = {search: '', locations: [], input: true}
  }

  componentDidMount(){
    Client.get('/api/recentsearch', (res) => {
      console.log(res);
      if(res){
        this.setState({search: res.res});
        this.loadResults();
      }
    })
  }

  editValue(event) {
    this.setState({search: event.target.value});
  }

  checkSubmit(e){
    if(e.key === 'Enter') this.loadResults();
  }

  loadResults(){
    Client.get('/api/venues/' + encodeURIComponent(this.state.search), (res) => {
      res.forEach(l => l.class = 'display-name');
      this.setState({locations: res});
      this.setState({input: false})
      Client.post('/api/recentsearch', {search: this.state.search}, function(res){
        
      });
    });
  }

  rsvp(oldLocation){
    Client.get('/api/currentuser', (res) => {
      if(res){
        let locations = this.state.locations;
        Client.patch('/api/rsvp', {locations: locations, location: oldLocation._id}, (data) => {
          var obj = (locations.find(l => l._id === oldLocation._id))
          var index = locations.indexOf(obj);
          data.class = oldLocation.class
          locations[index] = data;
          this.setState({locations: locations})
        });
      }
      else{
        window.location = '/auth/twitter';
      }
    })
  }

  enter(location){
    location.class = 'display-attendees';
    this.setState({location: location})
  }

  leave(location){
    location.class = 'display-name';
    this.setState({location: location});
  }

  activateInput(){
    this.setState({input: true});
  }

  render(){
    let input = <input placeholder='Where to?' value={this.state.search} onChange={this.editValue.bind(this)} onKeyPress={this.checkSubmit.bind(this)} id='location-input' autoComplete="off"/>
    let locations = 
    <div id='locations'>
      {this.state.locations.map( (location, i) => {
        return (
          <div className='location' key={i} id={location._id} onClick={this.rsvp.bind(this, location)} onMouseEnter={this.enter.bind(this, location)}
            onMouseLeave={this.leave.bind(this, location)}>
            <div className='row'>
              <img src={location.image} alt='bar'></img>
              <span style={{width: 300}} className={location.class}><p className='box-name'>{location.name}</p><p className='box-attendees'>{location.attendees} people are going</p></span>
            </div>
          </div>
        )
      })}
    </div>
    return (
      <div className='container'>
        <div className='center row'>
          <h1 onClick={this.activateInput.bind(this)}>Let's Go Somewhere!</h1>
        </div>
        {this.state.input ? input : locations}

        
      </div>
    );
  }
}

ReactDOM.render(<Index />, document.getElementById('root'));