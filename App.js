/**
 * Expo App Entry Point
 *
 * 这是Expo应用的入口文件，导入我们的主要应用组件
 */

import React, { useState } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';

// 简单的计算器组件
const App = () => {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState(null);
  const [operation, setOperation] = useState(null);

  const handleNumberPress = (num) => {
    if (display === '0') {
      setDisplay(String(num));
    } else {
      setDisplay(display + num);
    }
  };

  const handleOperationPress = (op) => {
    if (previousValue === null) {
      setPreviousValue(parseFloat(display));
    } else if (operation) {
      calculate();
    }
    setOperation(op);
    setDisplay('0');
  };

  const calculate = () => {
    const current = parseFloat(display);
    const previous = previousValue;

    if (previous === null || operation === null) return;

    let result;
    switch (operation) {
      case '+':
        result = previous + current;
        break;
      case '-':
        result = previous - current;
        break;
      case '×':
        result = previous * current;
        break;
      case '÷':
        result = previous / current;
        break;
      default:
        return;
    }

    setDisplay(String(result));
    setPreviousValue(null);
    setOperation(null);
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
  };

  const Button = ({ onPress, title, style }) => (
    <TouchableOpacity style={[styles.button, style]} onPress={onPress}>
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.displayContainer}>
        <Text style={styles.display}>{display}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <View style={styles.row}>
          <Button onPress={clear} title="C" style={styles.operatorButton} />
          <Button onPress={() => {}} title="±" style={styles.operatorButton} />
          <Button onPress={() => {}} title="%" style={styles.operatorButton} />
          <Button onPress={() => handleOperationPress('÷')} title="÷" style={styles.operatorButton} />
        </View>

        <View style={styles.row}>
          <Button onPress={() => handleNumberPress('7')} title="7" />
          <Button onPress={() => handleNumberPress('8')} title="8" />
          <Button onPress={() => handleNumberPress('9')} title="9" />
          <Button onPress={() => handleOperationPress('×')} title="×" style={styles.operatorButton} />
        </View>

        <View style={styles.row}>
          <Button onPress={() => handleNumberPress('4')} title="4" />
          <Button onPress={() => handleNumberPress('5')} title="5" />
          <Button onPress={() => handleNumberPress('6')} title="6" />
          <Button onPress={() => handleOperationPress('-')} title="-" style={styles.operatorButton} />
        </View>

        <View style={styles.row}>
          <Button onPress={() => handleNumberPress('1')} title="1" />
          <Button onPress={() => handleNumberPress('2')} title="2" />
          <Button onPress={() => handleNumberPress('3')} title="3" />
          <Button onPress={() => handleOperationPress('+')} title="+" style={styles.operatorButton} />
        </View>

        <View style={styles.row}>
          <Button onPress={() => handleNumberPress('0')} title="0" style={styles.zeroButton} />
          <Button onPress={() => {}} title="." />
          <Button onPress={calculate} title="=" style={styles.equalsButton} />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  displayContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  display: {
    fontSize: 60,
    color: '#fff',
    fontWeight: '200',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  button: {
    flex: 1,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  buttonText: {
    fontSize: 30,
    color: '#fff',
    fontWeight: '400',
  },
  operatorButton: {
    backgroundColor: '#ff9500',
  },
  equalsButton: {
    backgroundColor: '#ff9500',
  },
  zeroButton: {
    flex: 2,
  },
});

export default App;