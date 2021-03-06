import React, { Component } from 'react';
import { Switch, Route } from 'react-router-dom';

import Game from './components/Game';
import Login from './components/Login';
import SignUp from './components/SignUp';
import NavBar from './components/NavBar';
import UserPage from './components/UserPage';

import './style.css';
// import pictures from './Picture';
import pictures from './pictures';

const initialState = {
  cardCreated: false,
  user: {}, // {username, bestRecord, played}
  cards: [],
  clickCount: 0,
  matched: 0, // increment when ever the 2 cards values match, game ends when matched = 16
  previousCard: {}, // add in the cardObj from cards
  previousCardID: -1,
  currentCard: {},
  currentCardID: -1,
  cardNeedUpdate: false,
  leaderBoard: {}, // { bestRecord: [{ username: bestRecord }, ...], { mostPlays: [{ username: played }, ... ]}}
  found: null,
  canClick: true,
  hasWon: false,
};

class App extends Component {
  constructor(props) {
    super(props);
    this.state = initialState;

    this.logInUser = this.logInUser.bind(this);
    this.signUpUser = this.signUpUser.bind(this);
    this.onCardClick = this.onCardClick.bind(this);
    this.processFinalMatch = this.processFinalMatch.bind(this);
    this.processNormalMatch = this.processNormalMatch.bind(this);
    this.processNotMatch = this.processNotMatch.bind(this);
    this.changeUserName = this.changeUserName.bind(this);
  }

  componentDidMount() {
    const cards = this.createRandomCards();
    const cardCreated = true;
    this.setState({ ...this.state, cards, cardCreated });
  }

  async getUserAndLeaderBoard() {
    const { user, leaderBoard } = await fetch('/api/update', {
      method: 'PUT',
      body: JSON.stringify({
        user: this.state.user,
        clickCount: this.state.clickCount,
      }),
      headers: {
        'Content-type': 'application/json',
      },
    }).then((data) => data.json());

    return { user, leaderBoard };
  }

  async processFinalMatch() {
    const { clickCount } = this.state;

    const cards = this.createRandomCards();
    const { user, leaderBoard } = await this.getUserAndLeaderBoard();

    this.setState({
      ...initialState,
      user,
      leaderBoard,
      cards,
      clickCount,
    });
  }

  processNormalMatch() {
    const { currentCard, matched } = this.state;

    const found = currentCard.cardValue;

    this.setState({
      matched: matched + 2,
      cardNeedUpdate: false,
      previousCard: {},
      previousCardID: -1,
      currentCard: {},
      currentCardID: -1,
      found,
      canClick: true,
    });
  }

  processNotMatch() {
    const { currentCardID, previousCardID, cards } = this.state;

    const newCards = cards.map((card, idx) =>
      idx === previousCardID || idx === currentCardID
        ? { ...card, flipped: false }
        : card
    );

    setTimeout(() => {
      this.setState({
        cards: newCards,
        previousCard: {},
        previousCardID: -1,
        currentCard: {},
        currentCardID: -1,
        cardNeedUpdate: false,
        canClick: true,
      });
    }, 1500);
  }

  async componentDidUpdate() {
    const { cardNeedUpdate, currentCard, previousCard, matched } = this.state;
    const isMatched = currentCard.cardValue === previousCard.cardValue;

    if (!cardNeedUpdate) return;

    if (!isMatched) return this.processNotMatch();

    // final match
    if (matched === 14) {
      this.setState({hasWon: true})
      await this.processFinalMatch();
    } else {
      // a match but not the final match
      // store the cardValue in found so we can display the match in message
      this.processNormalMatch();
    }
  }

  // first Card is clicked --> canClick true --> setState -> componentDidUpdate() --> cardNeedUpdate is false XXX
  // second card is clicked --> setState() --> cardNeedUpdate = true and canClick = false -->
  // componentDidUpdate() --> gross/if else

  createRandomCards() {
    const cards = pictures.map((picture, idx) => ({
      flipped: false,
      cardValue: idx,
      picture,
    }));

    cards.push(...cards);
    cards.sort(() => Math.random() - 0.5);

    return cards;
  }

  onCardClick(cardIdx) {
    const { canClick, clickCount, cards } = this.state;

    if (!canClick) return;

    const newClickCount = clickCount + 1;
    const flippedCard = { ...cards[cardIdx], flipped: true };
    const newCards = cards.map((card, idx) =>
      idx === cardIdx ? flippedCard : card
    );

    const newState =
      newClickCount % 2 === 1
        ? // Odd click === first card
          {
            cards: newCards,
            clickCount: newClickCount,
            previousCard: flippedCard,
            previousCardID: cardIdx,
            found: null,
          }
        : // Even click === second card
          // at this point, the 2nd card is not flipped yet, so we need to update the state to complete the flipping
          // after components have been updated, we will check for if previous card value matches the current card value
          {
            cards: newCards,
            clickCount: newClickCount,
            currentCard: flippedCard,
            currentCardID: cardIdx,
            cardNeedUpdate: true,
            canClick: false,
          };

    this.setState(newState);
  }

  logInUser(data) {
    // send post request to server to log in
    const { user, leaderBoard } = data;
    console.log('logged in user is', user);
    this.setState({ user, leaderBoard });
  }

  signUpUser(data) {
    // send post request to server to sign up
    const { user, leaderBoard } = data;
    console.log('signed up user is', user);
    this.setState({ user, leaderBoard });
  }

  changeUserName(newUserName) {
    this.setState({
      user: {
        ...this.state.user,
        username: newUserName,
      },
    });
  }

  render() {
    console.log(this.state.user);
    return (
      <div className="router">
        <Switch>
          <Route
            exact
            path="/"
            render={(props) => <Login {...props} logInUser={this.logInUser} />}
          />
          <Route
            exact
            path="/SignUp"
            render={(props) => (
              <SignUp {...props} signUpUser={this.signUpUser} />
            )}
          />
          <Route
            exact
            path="/game"
            render={(props) => (
              <Game
                {...props}
                state={this.state}
                onCardClick={this.onCardClick}
              />
            )}
          />

          <Route
            exact
            path="/user"
            render={(props) => (
              <UserPage
                {...props}
                user={this.state.user}
                changeUserName={this.changeUserName}
              />
            )}
          />
        </Switch>
      </div>
    );
  }
}

export default App;
