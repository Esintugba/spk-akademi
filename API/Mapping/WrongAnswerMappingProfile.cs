using API.Dtos;
using API.Entities;
using AutoMapper;

namespace API.Mapping;

public class WrongAnswerMappingProfile : Profile
{
    public WrongAnswerMappingProfile()
    {
        CreateMap<WrongAnswerQueue, WrongAnswerQueueItemDto>()
            .ForMember(dest => dest.SuccessRate, opt => opt.Ignore());
    }
}
