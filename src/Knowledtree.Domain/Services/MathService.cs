using System;
using System.Collections.Generic;

namespace Knowledtree.Domain.Services
{
    /// <summary>
    /// A simple math service for testing purposes
    /// </summary>
    public class MathService
    {
        // TODO: This should be configurable
        private int magicNumber = 42;
        
        /// <summary>
        /// Divides two numbers
        /// </summary>
        public double Divide(int a, int b)
        {
            // BUG: No check for division by zero!
            return a / b;
        }
        
        /// <summary>
        /// Calculates factorial of a number
        /// </summary>
        public int Factorial(int n)
        {
            // ISSUE: No validation for negative numbers
            // ISSUE: Will overflow for large numbers
            int result = 1;
            for (int i = 1; i <= n; i++)
            {
                result = result * i;
            }
            return result;
        }
        
        /// <summary>
        /// Finds the maximum value in a list
        /// </summary>
        public int FindMax(List<int> numbers)
        {
            // BUG: Will throw exception if list is null or empty
            int max = numbers[0];
            for (int i = 0; i < numbers.Count; i++)
            {
                if (numbers[i] > max)
                    max = numbers[i];
            }
            return max;
        }
        
        /// <summary>
        /// Converts temperature from Celsius to Fahrenheit
        /// </summary>
        public double CelsiusToFahrenheit(double celsius)
        {
            // Using magic number instead of constant
            return celsius * 1.8 + 32;
        }
        
        /// <summary>
        /// Gets password (for testing purposes only)
        /// </summary>
        public string GetPassword()
        {
            // SECURITY ISSUE: Hardcoded password!
            string password = "admin123";
            return password;
        }
        
        /// <summary>
        /// Process data with poor exception handling
        /// </summary>
        public void ProcessData(string data)
        {
            try
            {
                // Do something with data
                Console.WriteLine(data.ToUpper());
            }
            catch (Exception ex)
            {
                // BAD PRACTICE: Swallowing exception
            }
        }
        
        /// <summary>
        /// Unused method - dead code
        /// </summary>
        private void UnusedMethod()
        {
            // This method is never called
            var x = magicNumber;
        }
    }
}
