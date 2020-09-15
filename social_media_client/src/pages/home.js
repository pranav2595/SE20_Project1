import React, { Component } from "react";
import axios from "axios";
import Grid from "@material-ui/core/Grid";

import Scream from "../component/Scream";
export class home extends Component {
  state = {
    screams: null,
  };
  async componentDidMount() {
    let res = await axios.get("/screams").catch((err) => console.log(err));
    console.log(res.data);
    this.setState({ screams: res.data });
  }
  render() {
    let recentScreamMarkup = this.state.screams ? (
      this.state.screams.map((scream) => (
        <Scream key={scream.screamId} scream={scream} />
      ))
    ) : (
      <p>Loading...</p>
    );
    return (
      <Grid container spacing={7}>
        <Grid item sm={8} xs={12}>
          {recentScreamMarkup}
        </Grid>
        <Grid item sm={4} xs={12}>
          <p>Profile...</p>
        </Grid>
      </Grid>
    );
  }
}

export default home;
