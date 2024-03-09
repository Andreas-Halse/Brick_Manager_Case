import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Button, Paper, Typography, Grid, Card, CardContent } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { createStyles, Theme } from '@material-ui/core/styles';


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
        material: number; // Assuming material is a number based on your example, adjust if it's actually a string or other type
        partType: string;
    };
    quantity: number;
}


const UserPage: React.FC = () => {
    const classes = useStyles();
    const { username } = useParams<{ username: string }>();
    const [userInventory, setUserInventory] = useState<UserCollection[]>([]);
    const [buildableSets, setBuildableSets] = useState<Set[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userResponse = await axios.get<{ id: string; collection: UserCollection[] }>(`https://d16m5wbro86fg2.cloudfront.net/api/user/by-username/${username}`);
                const userId = userResponse.data.id;
                const collectionResponse = await axios.get<{ collection: UserCollection[] }>(`https://d16m5wbro86fg2.cloudfront.net/api/user/by-id/${userId}`);
                const collection = collectionResponse.data.collection;
                setUserInventory(collection);

                const setsResponse = await axios.get<{ Sets: Set[] }>('https://d16m5wbro86fg2.cloudfront.net/api/sets');
                const Sets = setsResponse.data.Sets;

                const buildable = await Promise.all(Sets.map(async (set) => {
                    const setResponse = await axios.get<{ pieces: PieceRequirement[] }>(`https://d16m5wbro86fg2.cloudfront.net/api/set/by-id/${set.id}`);
                    const pieces = setResponse.data.pieces;
                    const canBuild = pieces.every(piece => {
                        const userPiece = collection.find(up => up.pieceId === piece.part.designID);
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
        console.log(`Sets ${username} can build:`, buildableSets.map(set => set.name));
    };

    // Render UI with the obtained data...
    return (
        <div className={classes.root}>
            <h1 className={classes.title}>{`User: ${username}`}</h1>
            <Button variant="contained" color="primary" className={classes.button} onClick={handleButtonClick}>
                See what sets {username} can create!
            </Button>
        </div>
    );
}

export default UserPage;
