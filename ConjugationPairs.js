import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView } from 'react-native';

const ConjugationPairs = ({ verbsData }) => {
  const [pageIndex, setPageIndex] = useState(0);
  const itemsPerPage = 6;
  const totalPages = Math.ceil(verbsData.length / itemsPerPage);

  const getCurrentData = () => {
    const start = pageIndex * itemsPerPage;
    return verbsData.slice(start, start + itemsPerPage);
  };

  const nextPage = () => {
    setPageIndex(prev => (prev + 1) % totalPages);
  };

  const previousPage = () => {
    setPageIndex(prev => (prev - 1 + totalPages) % totalPages);
  };

  return (
    <ScrollView style={styles.container}>
      {getCurrentData().map((pair, index) => (
        <View key={index} style={styles.pairRow}>
          <Text style={styles.text}>{pair.russiantext} - {pair.hebrewtext}</Text>
        </View>
      ))}
      <View style={styles.buttonContainer}>
        <Button title="Предыдущие 6" onPress={previousPage} disabled={pageIndex === 0} />
        <Button title="Следующие 6" onPress={nextPage} disabled={pageIndex === totalPages - 1} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10
  },
  pairRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc'
  },
  text: {
    fontSize: 18
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20
  }
});

export default ConjugationPairs;
