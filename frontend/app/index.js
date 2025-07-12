import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import axios from 'axios';

export default function App() {
  const [data, setData] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:8000/')
      .then((res) => {
        console.log('Backend response:', res.data);
        setData(res.data);
      })
      .catch((err) => console.error(err));
  }, []);


  return (
    <View>
      <Text>Data from backend: {JSON.stringify(data)}</Text>
    </View>
  );
}
