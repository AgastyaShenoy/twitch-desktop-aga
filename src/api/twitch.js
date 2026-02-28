export const getLiveStreams = async (logins) => {
  if (!logins || logins.length === 0) return [];

  const query = `
    query GetLiveStreams($logins: [String!]) {
      users(logins: $logins) {
        login
        stream {
          id
          title
          type
          viewersCount
          previewImageURL(width: 320, height: 180)
          game {
            name
          }
        }
      }
    }
  `;

  const data = await window.electronAPI.twitchGql(query, { logins });
  if (!data || !data[0] || !data[0].data || !data[0].data.users) return [];

  return data[0].data.users.filter(u => u.stream !== null);
};

export const getRecentVods = async (login, first = 5) => {
  const query = `
    query GetRecentVods($login: String!, $first: Int!) {
      user(login: $login) {
        login
        videos(first: $first, types: [ARCHIVE]) {
          edges {
            node {
              id
              title
              lengthSeconds
              previewThumbnailURL(width: 320, height: 180)
              createdAt
              viewCount
              creator {
                login
              }
            }
          }
        }
      }
    }
  `;

  const data = await window.electronAPI.twitchGql(query, { login, first });
  if (!data || !data[0] || !data[0].data || !data[0].data.user || !data[0].data.user.videos) return [];

  return data[0].data.user.videos.edges.map(e => e.node);
};

export const searchChannels = async (searchTerm) => {
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

  const data = await window.electronAPI.twitchGql(query, { query: searchTerm });
  if (!data || !data[0] || !data[0].data || !data[0].data.searchFor || !data[0].data.searchFor.channels || !data[0].data.searchFor.channels.items) return [];

  return data[0].data.searchFor.channels.items.slice(0, 5);
};
