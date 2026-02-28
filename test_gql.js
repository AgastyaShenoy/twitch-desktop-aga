const clientId = 'kimne78kx3ncx6brgo4mv6wki5h1ko';

const query = `
    query SearchChannels($query: String!) {
      searchFor(userQuery: $query, platform: "web") {
        channels {
          items {
            login
            displayName
            profileImageURL(width: 50)
          }
        }
      }
    }
`;

fetch('https://gql.twitch.tv/gql', {
    method: 'POST',
    headers: {
        'Client-Id': clientId,
        'Content-Type': 'application/json',
    },
    body: JSON.stringify([{ query: query, variables: { query: 'esl_csgo' } }])
}).then(res => res.json()).then(data => console.log(JSON.stringify(data, null, 2)));
