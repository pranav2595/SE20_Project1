import React, { Component } from "react";
import logo from "../images/logo192.png";
import withStyles from "@material-ui/core/styles/withStyles";
import { Link } from "react-router-dom";
import dayjs from "dayjs";

//MUI stuff
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardMedia from "@material-ui/core/CardMedia";
import { Typography } from "@material-ui/core";
var relativeTime = require("dayjs/plugin/relativeTime");

const styles = {
  card: {
    display: "flex",
    marginBottom: 20,
  },
  image: {
    minwidth: 200,
  },
  CardContent: {
    padding: 25,
    objectFit: "cover",
  },
};

export class Scream extends Component {
  render() {
    dayjs.extend(relativeTime);
    const {
      classes,
      scream: { userHandle, body, createdAt },
    } = this.props;
    //const userImageAddress='C:\Users\ythak\OneDrive\Pictures\algo3_b'
    return (
      <Card className={classes.card}>
        <CardMedia
          image={logo}
          title="Pofile image"
          className={classes.image}
        />
        <CardContent className={classes.CardContent}>
          <Typography
            variant="h5"
            component={Link}
            to={`/users/${userHandle}`}
            color="primary"
          >
            {userHandle}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {dayjs(createdAt).fromNow()}
          </Typography>
          <Typography variant="body1">{body}</Typography>
        </CardContent>
      </Card>
    );
  }
}

export default withStyles(styles)(Scream);
