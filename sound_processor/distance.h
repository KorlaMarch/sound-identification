#ifndef DISTANCE_H

#define DISTANCE_H

#include "math.h"
#include "array"
#include "constant.h"

double EuclideanDistance(std::array<double, VECSIZE>& a, std::array<double, VECSIZE>& b);
double ManhattanDistance(std::array<double, VECSIZE>& a, std::array<double, VECSIZE>& b);
double cosineDistance(std::array<double, VECSIZE>& a, std::array<double, VECSIZE>& b);
double doDistance(std::array<double, VECSIZE>& a, std::array<double, VECSIZE>& b, char distanceType);

#endif