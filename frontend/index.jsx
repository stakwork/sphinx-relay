import React from 'react';
import ReactDOM from 'react-dom';
import Root from './components/Root.jsx';
import { getCookie } from './cookies'

ReactDOM.render(
  <Root isLoggedIn={getCookie('x-user-token') != null} />,
  document.getElementById('app')
);
