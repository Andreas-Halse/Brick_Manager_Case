import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Button, List, ListItem, ListItemText, Paper, Typography } from '@material-ui/core';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { Grid } from '@material-ui/core';
import { Chart, CategoryScale, LinearScale, BarElement, BarController, Title, Tooltip, Legend } from 'chart.js';
import CollaborateOnSet from './CollaborateOnSet';
import LargestCompatibleBuild from './LargestCompatibleBuild';

Chart.register(CategoryScale, LinearScale, BarElement, BarController, Title, Tooltip, Legend);



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
        button: {
            marginTop: theme.spacing(2),
        },
        buttonMargin: {
            marginTop: theme.spacing(8),
        },
        listContainer: {
            backgroundColor: '#D0E6A5', // Dusty green background
            maxWidth: 360,
            margin: theme.spacing(2),
            padding: theme.spacing(2),
            borderRadius: theme.shape.borderRadius,
        },
        headline: {
            marginTop: theme.spacing(10),
        },
        paper: {
            padding: theme.spacing(2),
            marginBottom: theme.spacing(2),
        },
        card: {
            minWidth: 192,
            marginBottom: theme.spacing(2),
        },
        gridContainer: {
            justifyContent: 'flex-end',
            paddingRight: theme.spacing(2),
            paddingLeft: theme.spacing(2),
            maxHeight: '500px',
            overflow: 'auto',
        },
        pieceText: {
            fontSize: '0.91rem',
        },
        list: {
            backgroundColor: theme.palette.background.paper,
            width: '100%',
        },
        chartContainer: {
            height: '50vh',
            width: '50vw',
        },
    }),
);

interface UserCollection {
    pieceId: string;
    variants: Variant[];
}

interface Variant {
    color: string;
    count: number;
}

interface Set {
    id: string;
    name: string;
    pieces: PieceRequirement[];
}
interface User {
    brickCount: number;
    [prop: string]: any;
}


interface PieceRequirement {
    part: {
        designID: string;
        material: number;
        partType: string;
    };
    quantity: number;
}

const setEmojis: { [key: string]: string } = {
    'alien-spaceship': '👽',
    'beach-buggy': '🏖️',
    'car-wash': '🚗💦',
    'castaway': '🏝️',
    'coffee-bar': '☕',
    'desert-landscape': '🏜️',
    'lunar-module': '🚀',
    'lunar-new-year': '🎉',
    'observatory-telescope': '🔭',
    'paris-by-night': '🌙🇫🇷',
    'peacock-farm': '🦚',
    'treasure-caves': '💎',
    'tropical-island': '🌴',
    'undersea-monster': '🐙',
    'winter-wonderland': '❄️',
};

const UserPage: React.FC = () => {
    const classes = useStyles();
    const { username } = useParams<{ username: string }>();
    const [userInventory, setUserInventory] = useState<UserCollection[]>([]);
    const [buildableSets, setBuildableSets] = useState<Set[]>([]);
    const [showSets, setShowSets] = useState<boolean>(false);
    const chartRef = useRef(null);
    const [showCollaborateOnSet, setShowCollaborateOnSet] = useState(false);
    const [showLargestCompatibleBuild, setShowLargestCompatibleBuild] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userResponse = await axios.get<{ id: string; collection: UserCollection[] }>(`https://d16m5wbro86fg2.cloudfront.net/api/user/by-username/${username}`);
                const userId = userResponse.data.id;
                const collectionResponse = await axios.get<{ collection: UserCollection[] }>(`https://d16m5wbro86fg2.cloudfront.net/api/user/by-id/${userId}`);
                setUserInventory(collectionResponse.data.collection);

                const setsResponse = await axios.get<{ Sets: Set[] }>('https://d16m5wbro86fg2.cloudfront.net/api/sets');
                const Sets = setsResponse.data.Sets;

                const buildable = await Promise.all(Sets.map(async (set) => {
                    const setResponse = await axios.get<{ pieces: PieceRequirement[] }>(`https://d16m5wbro86fg2.cloudfront.net/api/set/by-id/${set.id}`);
                    const pieces = setResponse.data.pieces;
                    const canBuild = pieces.every(piece => {
                        const userPiece = collectionResponse.data.collection.find(up => up.pieceId === piece.part.designID);
                        if (!userPiece) return false;
                        const variant = userPiece.variants.find(v => v.color === piece.part.material.toString());
                        return variant && variant.count >= piece.quantity;
                    });
                    return canBuild ? set : null;
                }));

                setBuildableSets(buildable.filter((set): set is Set => set !== null));

                // Get all users data  
                const usersResponse = await axios.get('https://d16m5wbro86fg2.cloudfront.net/api/users');
                const Users = usersResponse.data.Users;

                // Calculate average bricks  
                let totalBricks = 0;
                for (let user of Users) {
                    totalBricks += user.brickCount;
                }
                let averageBricks = totalBricks / Users.length;

                // Find the current user's bricks  
                let currentUserBricks = Users.find((user: User) => user.username === username)?.brickCount || 0;

                // Create chart  
                if (chartRef && chartRef.current) {
                    const chartInstance = new Chart(chartRef.current, {
                        type: 'bar',
                        data: {
                            labels: ['Average User', username],
                            datasets: [{
                                label: 'Number of Bricks',
                                data: [averageBricks, currentUserBricks],
                                backgroundColor: [
                                    'rgba(255, 99, 132, 0.2)',
                                    'rgba(54, 162, 235, 0.2)',
                                ],
                                borderColor: [
                                    'rgba(255, 99, 132, 1)',
                                    'rgba(54, 162, 235, 1)',
                                ],
                                borderWidth: 1
                            }]
                        },
                        options: {
                            scales: {
                                y: {
                                    beginAtZero: true
                                }
                            }
                        }
                    });
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, [username]);

    const handleButtonClick = () => {
        setShowSets(!showSets);
    };

    return (
        <div className={classes.root}>
            <h1 className={classes.title}>{`User: ${username}`}</h1>
            <Button variant="contained" color="primary" className={classes.button} onClick={handleButtonClick}>
                {showSets ? 'Hide' : 'See'} what sets {username} can create!
            </Button>
            <Button variant="contained" color="primary" className={classes.button} onClick={() => setShowCollaborateOnSet(!showCollaborateOnSet)}>
                Collaborate on a Set
            </Button>
            {showCollaborateOnSet && <CollaborateOnSet />}
            <Button variant="contained" color="primary" className={classes.button} onClick={() => setShowLargestCompatibleBuild(!showLargestCompatibleBuild)}>
                Bricks that atleast 50% of users have
            </Button>
            {showLargestCompatibleBuild && <LargestCompatibleBuild />}
            <Button variant="contained" color="primary" className={classes.button} onClick={() => { }}>
                Task 4
            </Button>
            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    {showSets && (
                        <>
                            <Typography variant="h6" className={classes.buttonMargin}>
                                Buildable Sets:
                            </Typography>
                            <Paper className={classes.listContainer}>
                                {buildableSets.length > 0 ? (
                                    <List>
                                        {buildableSets.map((set) => (
                                            <ListItem key={set.id}>
                                                <ListItemText primary={
                                                    <span>
                                                        <span style={{ fontSize: '24px' }}>{setEmojis[set.name.toLowerCase()] || '🧱'}</span>
                                                        {' '}
                                                        <span style={{ fontSize: '18px', marginLeft: '10px' }}>{set.name}</span>
                                                    </span>
                                                } />
                                            </ListItem>
                                        ))}
                                    </List>
                                ) : (
                                    <Typography variant="body2">
                                        No sets can be built with the current inventory.
                                    </Typography>
                                )}
                            </Paper>
                        </>
                    )}
                </Grid>
                <Grid item xs={12} md={4}>
                    <Typography variant="h6" className={classes.headline}>
                        You VS the average user:
                    </Typography>
                    <div>
                        <canvas ref={chartRef} />
                    </div>
                </Grid>
            </Grid>
        </div>
    );

}

export default UserPage;
