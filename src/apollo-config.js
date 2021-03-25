
import { onError } from "@apollo/client/link/error";
import map from 'lodash/map'

export default function ({ redirect, app, env, store }) {
  
  const baseURL = process.browser
  ? '<%= options.browserBaseURL %>'
  : '<%= options.baseURL %>'

  const link = onError((error) => {
    if (error.graphQLErrors) {
      console.log('ApolloClient graphQLErrors')
      console.log(error.graphQLErrors)
    }
    if (error.networkError) {
      console.log('ApolloClient networkError')
      console.log(error.networkError.bodyText)
    }
  })

  const request = link.request

  link.request = (operation, forward) => {
    operation.setContext({
      fetchOptions: {
        credentials: 'include'
      }
    });

    const headers = {}
    if (
      store.getters['common/customer/token']
    ) {
      headers['Authorization'] = `Bearer ${
        store.getters['common/customer/token']
      }`
    }

    headers['Cookie'] = map(
      app.$cookies.getAll(),
      (value, index) => {
        let resValue = value
        if(typeof value === 'object') {
          resValue = JSON.stringify(resValue)
        }
        if (typeof value === 'array') {
          resValue = JSON.stringify(resValue)
        }
        return index + '=' + resValue
      }
    ).join(';')

    operation.setContext({
      headers
    });
    return request(operation, forward)
  }

  return {
    link,
    httpEndpoint:baseURL,
  }
}