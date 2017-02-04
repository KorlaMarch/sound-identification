#ifndef SICONFIG_H

#define SICONFIG_H

#include "string"

struct SICONFIG{
	std::string infile;
	std::string outfile;
	std::string tsfile;
	char windows, distance;
	char inputType;

	bool isTrain;
	unsigned int kcon;

	SICONFIG(){
		infile = "";
		outfile = "";
		tsfile = "";
		windows = '\0';
		distance = '\0';
		inputType = '\0';
		isTrain = false;
		kcon = 1;
	}
};

#endif