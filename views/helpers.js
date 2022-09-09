const getUserByEmail = (email, userList) => {
  for (let user in userList) {
    if (email === userList[user].email) {
      return userList[user].id;
    }
  } return null
}

module.exports = { getUserByEmail };
