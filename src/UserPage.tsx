import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Button, List, ListItem, ListItemText, Paper, Typography } from '@material-ui/core';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';

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
        listContainer: {
            backgroundColor: '#D0E6A5', // Dusty green background
            maxWidth: 360,
            margin: theme.spacing(2),
            padding: theme.spacing(2),
            borderRadius: theme.shape.borderRadius,
        },
        headline: {
            marginTop: theme.spacing(4),
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
            {showSets && (
                <>
                    <Typography variant="h6" className={classes.headline}>
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
        </div>
    );
}

export default UserPage;
