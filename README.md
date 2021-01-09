# safe-paths
An application that allows users to search for safe routes to travel between source and destination. 

## Android application 

Primarily an android application with emphasis on showing google maps efficiently. 

## Back-end
A NodeJS back-end with Clustering algorithm pre-trained on Crime datasets.
  ### Architecture:
  ![arch image](https://github.com/udaypb/safe-paths/blob/master/Architecture.png)


## DataSet
- The dataset being used is the crime dataset of the city of Chicago provided by Chicago public data portal. (https://data.cityofchicago.org/Public-Safety/Crimes-2019/w98m-zvie)
- Total  220K cases from the 2019 crime data.


## Clustering 
Based on the crime data, a model is pretrained on the labels for each of the crime events occured in the pre-defined area.

## How to:
- The project needs a running MySQL instance with the database schema (which is the default schema that we get from the data.csv file.)


## Dependencies
- Node.JS (12.13.1)
- Python (3)
- MySQL 

## Screens
<img src="https://github.com/udaypb/safe-paths/blob/master/safePaths-screenshot-1.png" width="100" height="100">
  ![arch image](https://github.com/udaypb/safe-paths/blob/master/safePaths-screenshot-1.png =250x250)  
  ![arch image](https://github.com/udaypb/safe-paths/blob/master/safePaths-secreenshot-2.png)
