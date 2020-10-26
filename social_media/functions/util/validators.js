const isEmail = (email) => {
  const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (email.match(regEx)) return true;
  else return false;
};

const hasNoWhiteSpace = (string) => {
  if (string.trim() === "") return true;
  else return false;
};

exports.validateSignupData = (data) => {
  let errors = {};

  console.log(data);
  if (data.email == undefined || !isEmail(data.email) ) {
    errors.email = "Must be a valid email address";
  } else if (hasNoWhiteSpace(data.email)) {
    errors.email = "Must not be empty";
  } 

  if (data.password == undefined || hasNoWhiteSpace(data.password)) errors.password = "Must not be empty";

  if (data.password !== data.confirmPassword)
    errors.confirmPassword = "Passwords must match";
  if (data.handle == undefined || hasNoWhiteSpace(data.handle)) errors.handle = "Must not be empty";
  
  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false,
  };
};

exports.validateLoginData = (data) => {
  let errors = {};

  if (hasNoWhiteSpace(data.email)) errors.email = "Must not be empty";
  if (hasNoWhiteSpace(data.password)) errors.password = "Must not be empty";

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false,
  };
};

exports.reduceUserDetails = (data) => {
  let userDetails = {};

  if (data.bio != undefined && !hasNoWhiteSpace(data.bio.trim())) userDetails.bio = data.bio;
  if (data.website != undefined && !hasNoWhiteSpace(data.website.trim())) {
    // https://website.com
    if (data.website.trim().substring(0, 4) !== "http") {
      userDetails.website = `http://${data.website.trim()}`;
    } else userDetails.website = data.website;
  }
  if (data.location !=undefined && !hasNoWhiteSpace(data.location.trim())) userDetails.location = data.location;

  console.log(userDetails);
  return userDetails;
};
