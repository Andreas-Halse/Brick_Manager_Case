import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Autosuggest from 'react-autosuggest';
import Button from '@material-ui/core/Button';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import { useNavigate } from 'react-router-dom';
import './App.css';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      backgroundColor: '#ADD8E6',
      height: '100vh',
      justifyContent: 'center',
      padding: theme.spacing(2),
    },
    title: {
      color: '#FFFFFF',
      marginBottom: theme.spacing(4),
    },
    input: {
      width: 300,
      height: 50,
      padding: '10px 20px',
      marginBottom: theme.spacing(2),
    },
    button: {
      marginTop: theme.spacing(2),
    },
    suggestion: {
      cursor: 'pointer',
      padding: '10px',
      border: '1px solid #ccc',
      borderRadius: '4px',
      marginBottom: '5px',
      backgroundColor: '#f9f9f9',
      '&:hover': {
        backgroundColor: '#e6e6e6',
      },
    },
  }),
);

const App: React.FC = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isValidUser, setIsValidUser] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      const result = await axios('https://d16m5wbro86fg2.cloudfront.net/api/users');
      setUsers(result.data.Users);
    };
    fetchUsers();
  }, []);

  const getSuggestions = (value: string) => {
    const inputValue = value.trim().toLowerCase();
    const inputLength = inputValue.length;

    return inputLength === 0 ? [] : users.filter(user =>
      user.username.toLowerCase().slice(0, inputLength) === inputValue
    ).map(user => user.username);
  };

  const onSuggestionsFetchRequested = ({ value }: any) => {
    setSuggestions(getSuggestions(value));
  };

  const onSuggestionsClearRequested = () => {
    setSuggestions([]);
  };

  const onChange = (event: any, { newValue }: any) => {
    setValue(newValue);
    setIsValidUser(users.some(user => user.username === newValue));
  };

  const onButtonClick = () => {
    if (isValidUser) {
      navigate(`/username/${value}`);
    }
  };

  const inputProps = {
    placeholder: 'Type a username',
    value,
    onChange: onChange,
    className: classes.input
  };

  const renderSuggestion = (suggestion: any) => (
    <div className={classes.suggestion}>{suggestion}</div>
  );

  return (
    <div className={classes.root}>
      <h1 className={classes.title}>Brick Manager</h1>
      <Autosuggest
        suggestions={suggestions}
        onSuggestionsFetchRequested={onSuggestionsFetchRequested}
        onSuggestionsClearRequested={onSuggestionsClearRequested}
        getSuggestionValue={(suggestion: any) => suggestion}
        renderSuggestion={renderSuggestion}
        inputProps={inputProps}
      />
      <Button variant="contained" color="primary" className={classes.button} onClick={onButtonClick} disabled={!isValidUser}>
        Do something with {value ? value : "the selected username"}
      </Button>
    </div>
  );
};

export default App;  
