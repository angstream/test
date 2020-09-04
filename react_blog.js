import { createBrowserHistory } from "history";
export default createBrowserHistory();

import axios from "axios";

export default axios.create({
  baseURL: "https://jsonplaceholder.typicode.com"
});

//actions/index.js

import _ from "lodash";
import jsonPlaceholder from "../apis/jsonplaceholder";

export const fetchPosts = () => async dispatch => {
  const response = await jsonPlaceholder.get("/posts");
  dispatch({
    type: "FETCH_POSTS",
    payload: response.data
  });
};

export const fetchUser = id => async dispatch => {
  const response = await jsonPlaceholder.get(`/users/${id}`);
  dispatch({
    type: "FETCH_USER",
    payload: response.data
  });
};

export const fetchPostsAndUsers = () => async (dispatch, getState) => {
  await dispatch(fetchPosts());

  _.chain(getState().posts)
    .map("userId")
    .uniq()
    .forEach(id => dispatch(fetchUser(id)))
    .value();
};

//App.js
import React from "react";
import { Router, Route } from "react-router-dom";
import history from "../history";
import ShowItem from "./ShowItem";
import PostList from "./PostList";
import ItemDelete from "./ItemDelete";

const App = () => {
  return (
    <div className="ui container">
      <Router history={history}>
        <div>
          <Route path="/" exact component={PostList} />
          <Route path="/show/:id" exact component={ShowItem} />
          <Route path="/delete/:id" exact component={ItemDelete} />
        </div>
      </Router>
    </div>
  );
};
export default App;

//PostList.js
import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { fetchPosts, fetchPostsAndUsers } from "../actions";
import UserHeader from "./UserHeader";
import Modal from "./Modal";
import ShowItem from "./ShowItem";

class PostList extends React.Component {
  componentDidMount() {
    this.props.fetchPostsAndUsers();
  }
  clickItem(id) {
    console.log(`click:${id}`);
    return <ShowItem />;
  }
  renderList() {
    return this.props.posts.map((post) => {
      return (
        <div
          className="item"
          key={post.id}
          onClick={() => this.clickItem(post.id)}
        >
          <i className="large middle aligned icon user" />
          <div className="content">
            <div className="description">
              <h3>{post.title}</h3>
              <div>{post.body}</div>
            </div>
            <UserHeader userId={post.userId} />
            <Link className="ui button primary" to={`/show/${post.id}`}>
              Details
            </Link>
            <Link className="ui button negative" to={`/delete/${post.id}`}>
              Delete
            </Link>
          </div>
        </div>
      );
    });
  }

  render() {
    //console.log(this.props.posts);
    return <div className="ui relaxed divided list"> {this.renderList()}</div>;
  }
}

const mapStateToProps = (state) => {
  return { posts: state.posts };
};

export default connect(mapStateToProps, { fetchPostsAndUsers })(PostList);

//UserHeader.js
import React from "react";
import { connect } from "react-redux";

class UserHeader extends React.Component {
  render() {
    const { user } = this.props;
    if (!user) return null;
    return (
      <div className="header">
        {user.name}
        <p></p>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return { user: state.users.find((user) => user.id === ownProps.userId) };
};

export default connect(mapStateToProps)(UserHeader);

//ShowItem.js
import React from "react";
import { connect } from "react-redux";

class ShowItem extends React.Component {
  componentDidMount() {}

  render() {
    console.log(this.props.match.params.id);
    console.log(this.props.post);
    const { body, id, title } = this.props.post || {};
    return (
      <div>
        <h3>Show Item</h3>
        <div className="content">
          <div className="description">
            <h3>{title}</h3>
            <div>{body}</div>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  let id = ownProps.match.params.id;
  return { post: state.posts[id] };
};
export default connect(mapStateToProps, {})(ShowItem);

//ItemDelete.js
import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import Modal from "./Modal";
import history from "../history";

class ItemDelete extends React.Component {
  renderActions() {
    const { id } = this.props.match.params;
    return (
      <React.Fragment>
        <button onClick={() => console.log(id)} className="ui button negative">
          Delete
        </button>
        <Link to="/" className="ui button">
          Cancel
        </Link>
      </React.Fragment>
    );
  }

  renderContent() {
    if (!this.props.post) {
      return "R u sure you want to delete post";
    }

    return `Are you sure you want to delete the post with title:${this.props.post.title}`;
  }

  render() {
    return (
      <Modal
        title="Delete This Post"
        content={this.renderContent()}
        actions={this.renderActions()}
        onDismiss={() => history.push("/")}
      />
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return { post: state.posts[ownProps.match.params.id] };
};

export default connect(mapStateToProps, {})(ItemDelete);

//Modal.js
import React from "react";
import ReactDOM from "react-dom";
import history from "../history";

const Modal = (props) => {
  return ReactDOM.createPortal(
    <div
      className="ui dimmer modals visible active"
      onClick={() => history.push("/")}
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="ui standard modal visible active"
      >
        <div className="header">{props.title}</div>
        <div className="content">{props.content}</div>
        <div className="actions">{props.actions}</div>
      </div>
    </div>,
    document.querySelector("#modal")
  );
};

export default Modal;

//reducer/postsReducer.js
export default (state = [], action) => {
  switch (action.type) {
    case "FETCH_POSTS":
      return action.payload;
    default:
      return state;
  }
};

//userReducer.js
export default (state = [], action) => {
  switch (action.type) {
    case "FETCH_USER":
      return [...state, action.payload];
    default:
      return state;
  }
};

//reducers/index.js
import { combineReducers } from "redux";
import postsReducer from "./postsReducer";
import userReducer from "./userReducer";

export default combineReducers({
  posts: postsReducer,
  users: userReducer
});

//index.js
import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { createStore, applyMiddleware } from "redux";
import thunk from "redux-thunk";
import App from "./components/App";
import reducers from "./reducers";

const store = createStore(reducers, applyMiddleware(thunk));

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById("root")
);

//package.json
{
  "name": "blog",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "axios": "^0.19.0",
    "react": "^16.12.0",
    "react-dom": "^16.12.0",
    "react-redux": "^7.1.3",
    "react-router-dom": "^5.2.0",
    "react-scripts": "3.2.0",
    "redux": "^4.0.4",
    "redux-thunk": "^2.3.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": "react-app"
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
