#include "distance.h"

double euclideanDistance(std::array<double, VECSIZE>& a, std::array<double, VECSIZE>& b){
    double sum = 0;

    for(int i = 0; i < VECSIZE; i++){
        sum += (a[i]-b[i])*(a[i]-b[i]);
    }
    return sqrt(sum);
}

double manhattanDistance(std::array<double, VECSIZE>& a, std::array<double, VECSIZE>& b){
    double sum = 0;

    for(int i = 0; i < VECSIZE; i++){
        sum += fabs(a[i]-b[i]);
    }
    return sum;
}

double cosineDistance(std::array<double, VECSIZE>& a, std::array<double, VECSIZE>& b){
    double sumA=0.0,sumB=0.0,sumAB=0.0;

    for(int i = 0; i < VECSIZE; i++){
        sumA += a[i]*a[i];
        sumB += b[i]*b[i];
        sumAB += a[i]*b[i];
    }

    return sumAB/(sqrt(sumA)*sqrt(sumB));
}

double doDistance(std::array<double, VECSIZE>& a, std::array<double, VECSIZE>& b, char distanceType){
	switch(distanceType){
		case 'M':
		case 'm':
			return manhattanDistance(a,b);
		case 'C':
		case 'c':
			return cosineDistance(a,b);
		case '\0':
		case 'E':
		case 'e':
		default:
			return euclideanDistance(a,b);
	}
}